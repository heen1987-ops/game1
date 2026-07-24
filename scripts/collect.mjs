#!/usr/bin/env node
// 여행지/코스 콘텐츠 수집용 CLI. 큐 상태는 별도의 작은 SQLite(scripts/queue.db)에 두고,
// 실제 수집된 콘텐츠는 이 프로젝트의 Prisma DB(Place/GuideContent)에 바로 적재한다.
// 사용법: node scripts/collect.mjs <command> [args...]

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE_DB_PATH = path.join(__dirname, 'queue.db');
const QUEUE_SCHEMA = `
CREATE TABLE IF NOT EXISTS collection_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  source_hint TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  completed_at TEXT
);
`;

const SEED_QUERIES = [
  ['하나투어 인기 여행 코스', '하나투어'],
  ['모두투어 추천 여행 코스', '모두투어'],
  ['노랑풍선 인기 상품 여행지', '노랑풍선'],
  ['마이리얼트립 인기 코스', '마이리얼트립'],
  ['트리플 추천 일정', '트리플'],
  ['네이버 여행 인기 여행지 일본', '네이버 여행'],
  ['네이버 여행 인기 여행지 동남아', '네이버 여행'],
  ['네이버 여행 인기 여행지 유럽', '네이버 여행'],
  ['Trip.com popular itinerary Japan', 'Trip.com'],
  ['Trip.com popular itinerary Southeast Asia', 'Trip.com'],
  ['Klook popular things to do Japan', 'Klook'],
  ['TripAdvisor top attractions Osaka', 'TripAdvisor'],
  ['TripAdvisor top attractions Da Nang', 'TripAdvisor'],
  ['Lonely Planet best itinerary Europe', 'Lonely Planet'],
  ['한국관광공사 추천 국내 여행 코스', '한국관광공사 TourAPI'],
];

function queueDb() {
  const db = new DatabaseSync(QUEUE_DB_PATH);
  db.exec(QUEUE_SCHEMA);
  return db;
}

function cmdInit() {
  const db = queueDb();
  const row = db.prepare('SELECT COUNT(*) AS c FROM collection_queue').get();
  if (row.c === 0) {
    const insert = db.prepare(
      'INSERT INTO collection_queue (query, source_hint, status, created_at) VALUES (?, ?, ?, ?)'
    );
    const now = new Date().toISOString();
    for (const [query, hint] of SEED_QUERIES) insert.run(query, hint, 'pending', now);
    console.log(`Initialized queue with ${SEED_QUERIES.length} seed items.`);
  } else {
    console.log('Queue already initialized. Size:', row.c);
  }
  db.close();
}

function cmdQueueNext(n = 3) {
  const db = queueDb();
  const rows = db
    .prepare('SELECT id, query, source_hint FROM collection_queue WHERE status = ? ORDER BY id LIMIT ?')
    .all('pending', Number(n));
  console.log(JSON.stringify(rows, null, 2));
  db.close();
}

function cmdQueueAdd(query, hint) {
  if (!query) throw new Error('query required');
  const db = queueDb();
  db.prepare('INSERT INTO collection_queue (query, source_hint, status, created_at) VALUES (?, ?, ?, ?)').run(
    query,
    hint || null,
    'pending',
    new Date().toISOString()
  );
  console.log('Added queue item:', query);
  db.close();
}

function cmdQueueDone(id) {
  const db = queueDb();
  db.prepare("UPDATE collection_queue SET status = 'done', completed_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    Number(id)
  );
  console.log('Marked done:', id);
  db.close();
}

function cmdQueueSkip(id) {
  const db = queueDb();
  db.prepare("UPDATE collection_queue SET status = 'skipped', completed_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    Number(id)
  );
  console.log('Marked skipped:', id);
  db.close();
}

function cmdQueueStats() {
  const db = queueDb();
  const pending = db.prepare("SELECT COUNT(*) AS c FROM collection_queue WHERE status='pending'").get().c;
  const done = db.prepare("SELECT COUNT(*) AS c FROM collection_queue WHERE status='done'").get().c;
  const skipped = db.prepare("SELECT COUNT(*) AS c FROM collection_queue WHERE status='skipped'").get().c;
  console.log(JSON.stringify({ pending, done, skipped }, null, 2));
  db.close();
}

// ── Prisma 콘텐츠 적재 ─────────────────────────────────────────

const prisma = new PrismaClient();
const KNOWN_CATEGORIES = [
  'landmark', 'restaurant', 'cafe', 'shopping', 'hotel', 'airport', 'station', 'convenience', 'hospital',
];

async function cmdPlaceAdd(jsonStr) {
  const d = JSON.parse(jsonStr);
  const category = KNOWN_CATEGORIES.includes(d.category) ? d.category : 'landmark';
  const existing = await prisma.place.findFirst({
    where: { name: d.name, city: d.city ?? undefined, country: d.country ?? undefined },
  });
  let place;
  if (existing) {
    place = existing;
    console.log('Matched existing place:', d.name);
  } else {
    place = await prisma.place.create({
      data: {
        name: d.name,
        country: d.country ?? null,
        city: d.city ?? null,
        category,
        description: d.summary ?? null,
        mapQuery: d.name,
      },
    });
    console.log('Created place:', d.name);
  }
  if (d.summary) {
    const existingGuide = await prisma.guideContent.findFirst({
      where: { placeId: place.id, contentType: 'overview' },
    });
    if (!existingGuide) {
      await prisma.guideContent.create({
        data: {
          placeId: place.id,
          contentType: 'overview',
          title: d.name,
          content: d.summary,
          sourceUrl: d.source_url ?? null,
        },
      });
    }
  }
  console.log(place.id);
}

async function cmdTipAdd(jsonStr) {
  const t = JSON.parse(jsonStr);
  const anchor = await prisma.place.findFirst({
    where: { OR: [{ city: t.region ? { contains: t.region } : undefined }, { country: t.country ? { contains: t.country } : undefined }].filter(Boolean) },
  });
  if (!anchor) {
    console.log('No anchor place found for region/country, skipped tip:', t.title);
    return;
  }
  const existing = await prisma.guideContent.findFirst({ where: { placeId: anchor.id, title: t.title } });
  if (existing) {
    console.log('Tip already exists, skipped:', t.title);
    return;
  }
  await prisma.guideContent.create({
    data: {
      placeId: anchor.id,
      contentType: 'tip',
      title: t.title,
      content: t.content,
      sourceUrl: t.source_url ?? null,
    },
  });
  console.log('Added tip:', t.title, '-> anchored at', anchor.name);
}

const [, , cmd, ...args] = process.argv;

async function main() {
  switch (cmd) {
    case 'init':
      cmdInit();
      break;
    case 'queue:next':
      cmdQueueNext(args[0]);
      break;
    case 'queue:add':
      cmdQueueAdd(args[0], args[1]);
      break;
    case 'queue:done':
      cmdQueueDone(args[0]);
      break;
    case 'queue:skip':
      cmdQueueSkip(args[0]);
      break;
    case 'queue:stats':
      cmdQueueStats();
      break;
    case 'place:add':
      await cmdPlaceAdd(args[0]);
      break;
    case 'tip:add':
      await cmdTipAdd(args[0]);
      break;
    default:
      console.log(
        'Usage: node scripts/collect.mjs <init|queue:next|queue:add|queue:done|queue:skip|queue:stats|place:add|tip:add>'
      );
      process.exit(1);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
