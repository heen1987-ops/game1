// Desktop\travel-platform 의 콘텐츠 수집 파이프라인(db/travel.db)에서 모은
// 여행지/코스 데이터를 이 프로젝트의 Prisma Place/GuideContent 테이블로 옮긴다.
// 실행: npx tsx scripts/import-collected-content.ts
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { prisma } from '../lib/prisma';

const SOURCE_DB_PATH = path.join(
  'C:\\Users\\김희섭\\Desktop\\travel-platform\\db',
  'travel.db'
);

type SourceDestination = {
  id: number;
  name: string;
  country: string | null;
  region: string | null;
  category: string | null;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
};

type SourceCourse = {
  id: number;
  title: string;
  country: string | null;
  region: string | null;
  duration_days: number | null;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
};

type SourceStop = {
  course_id: number;
  destination_id: number | null;
  order_index: number;
  notes: string | null;
};

function mapCategory(raw: string | null): string {
  const known = ['landmark', 'restaurant', 'cafe', 'shopping', 'hotel', 'airport', 'station', 'convenience', 'hospital'];
  if (raw && known.includes(raw)) return raw;
  return 'landmark'; // 여행지/관광지류는 기본적으로 landmark로 매핑
}

async function main() {
  const src = new DatabaseSync(SOURCE_DB_PATH, { readOnly: true });

  const destinations = src.prepare('SELECT * FROM destinations').all() as unknown as SourceDestination[];
  const courses = src.prepare('SELECT * FROM courses').all() as unknown as SourceCourse[];
  const stops = src.prepare('SELECT * FROM course_stops').all() as unknown as SourceStop[];
  src.close();

  console.log(`소스: 여행지 ${destinations.length}건, 코스 ${courses.length}건, 스톱 ${stops.length}건`);

  const destIdToPlaceId = new Map<number, string>();
  let placesCreated = 0;
  let placesSkipped = 0;

  for (const d of destinations) {
    const existing = await prisma.place.findFirst({
      where: { name: d.name, city: d.region ?? undefined, country: d.country ?? undefined },
    });
    if (existing) {
      destIdToPlaceId.set(d.id, existing.id);
      placesSkipped++;
      continue;
    }

    const place = await prisma.place.create({
      data: {
        name: d.name,
        country: d.country,
        city: d.region,
        category: mapCategory(d.category),
        description: d.summary,
        mapQuery: d.name,
      },
    });
    destIdToPlaceId.set(d.id, place.id);
    placesCreated++;

    if (d.summary) {
      await prisma.guideContent.create({
        data: {
          placeId: place.id,
          contentType: 'overview',
          title: d.name,
          content: d.summary,
          sourceUrl: d.source_url,
        },
      });
    }
  }

  let coursesImported = 0;
  for (const c of courses) {
    const relatedStops = stops
      .filter((s) => s.course_id === c.id)
      .sort((a, b) => a.order_index - b.order_index);

    // GuideContent는 place에 반드시 연결되어야 한다. 스톱에 destination_id가 있으면 그걸 쓰고,
    // 없으면(수집 단계에서 종종 생략됨) 같은 지역/국가의 여행지 중 아무거나에 붙인다.
    let anchorPlaceId = relatedStops
      .map((s) => (s.destination_id ? destIdToPlaceId.get(s.destination_id) : undefined))
      .find(Boolean);

    if (!anchorPlaceId) {
      const sameRegionDest = destinations.find(
        (d) => (c.region && d.region === c.region) || (c.country && d.country === c.country)
      );
      if (sameRegionDest) anchorPlaceId = destIdToPlaceId.get(sameRegionDest.id);
    }
    if (!anchorPlaceId) continue;

    const stopNames = relatedStops.map((s) => s.notes).filter(Boolean).join(' → ');
    const title = `[추천 코스] ${c.title} (${c.duration_days ?? '?'}일)`;

    const existingTip = await prisma.guideContent.findFirst({ where: { placeId: anchorPlaceId, title } });
    if (existingTip) continue;

    await prisma.guideContent.create({
      data: {
        placeId: anchorPlaceId,
        contentType: 'tip',
        title,
        content: `${c.summary ?? ''}${stopNames ? `\n일정: ${stopNames}` : ''}`,
        sourceUrl: c.source_url,
      },
    });
    coursesImported++;
  }

  console.log(`Place 생성 ${placesCreated}건, 기존 매칭으로 스킵 ${placesSkipped}건`);
  console.log(`코스 → GuideContent(tip) 변환 ${coursesImported}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
