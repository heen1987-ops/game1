import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const OSAKA_TRIP_JSON = "G:\\내 드라이브\\CODE\\osaka-trip\\backend\\data\\trip.json";

type OsakaStop = {
  id: string;
  time?: string;
  name: string;
  category: string;
  note?: string;
  mapQuery?: string;
  lat?: number;
  lng?: number;
  anchor?: boolean;
  legMode?: string;
};

type OsakaDay = {
  id: string;
  date: string;
  label: string;
  title: string;
  summary?: string;
  stops: OsakaStop[];
};

type OsakaTrip = {
  title: string;
  hotel: {
    name: string;
    area?: string;
    bookingNumber?: string;
    guest?: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
    lat?: number;
    lng?: number;
  };
  transitPass?: { name: string; price: string; recommendedStart: string; reason: string; note: string };
  days: OsakaDay[];
  candidatePlaces?: OsakaStop[];
  dayTripIdeas?: (OsakaStop & { outOfArea?: boolean })[];
};

// osaka-trip 카테고리 → 공통 장소 DB 카테고리 매핑
const CATEGORY_MAP: Record<string, string> = {
  airport: "airport",
  train: "station",
  hotel: "hotel",
  shrine: "landmark",
  shopping: "shopping",
  landmark: "landmark",
  museum: "landmark",
  market: "shopping",
};

async function findOrCreatePlace(stop: { name: string; category: string; note?: string; mapQuery?: string; lat?: number; lng?: number }) {
  const existing = await prisma.place.findFirst({ where: { name: stop.name, city: "오사카" } });
  if (existing) return existing;
  return prisma.place.create({
    data: {
      name: stop.name,
      country: "일본",
      city: "오사카",
      category: CATEGORY_MAP[stop.category] ?? "other",
      lat: stop.lat ?? null,
      lng: stop.lng ?? null,
      mapQuery: stop.mapQuery ?? stop.name,
      description: stop.note ?? null,
    },
  });
}

async function seedOsakaTrip() {
  if (!fs.existsSync(OSAKA_TRIP_JSON)) {
    console.log(`osaka-trip 데이터 없음 (${OSAKA_TRIP_JSON}), 스킵`);
    return;
  }
  const raw = fs.readFileSync(OSAKA_TRIP_JSON, "utf-8");
  const data: OsakaTrip = JSON.parse(raw);

  const existingTrip = await prisma.trip.findFirst({ where: { name: data.title } });
  if (existingTrip) {
    console.log(`이미 존재하는 여행: ${data.title} — 스킵 (재시드하려면 DB를 초기화하세요)`);
    return;
  }

  const firstDay = data.days[0];
  const lastDay = data.days[data.days.length - 1];

  const trip = await prisma.trip.create({
    data: {
      name: data.title,
      type: "leisure",
      startDate: new Date(firstDay.date),
      endDate: new Date(lastDay.date),
      country: "일본",
      city: "오사카",
      status: "confirmed",
      description: data.transitPass ? `${data.transitPass.name}: ${data.transitPass.reason}` : null,
    },
  });

  // 숙소
  const hotelPlace = await findOrCreatePlace({
    name: data.hotel.name,
    category: "hotel",
    note: data.hotel.notes,
    mapQuery: data.hotel.name,
    lat: data.hotel.lat,
    lng: data.hotel.lng,
  });
  await prisma.accommodation.create({
    data: {
      tripId: trip.id,
      placeId: hotelPlace.id,
      name: data.hotel.name,
      checkIn: new Date(data.hotel.checkInDate),
      checkOut: new Date(data.hotel.checkOutDate),
      reservationNumber: data.hotel.bookingNumber ?? null,
      status: "confirmed",
    },
  });

  // 일차별 일정 + 장소
  for (const day of data.days) {
    const itinerary = await prisma.itinerary.create({
      data: {
        tripId: trip.id,
        date: new Date(day.date),
        title: day.title,
        description: day.summary ?? null,
      },
    });

    let seq = 0;
    for (const stop of day.stops) {
      const place = await findOrCreatePlace(stop);
      await prisma.tripPlace.upsert({
        where: { tripId_placeId: { tripId: trip.id, placeId: place.id } },
        update: {},
        create: { tripId: trip.id, placeId: place.id, visitStatus: "planned" },
      });
      await prisma.itineraryItem.create({
        data: {
          itineraryId: itinerary.id,
          placeId: place.id,
          startTime: stop.time ?? null,
          sequence: seq++,
          transportType: stop.legMode ?? null,
          isAnchor: stop.anchor ?? false,
          status: "planned",
          memo: stop.note ?? null,
        },
      });
    }
  }

  // 후보 장소
  for (const candidate of data.candidatePlaces ?? []) {
    const place = await findOrCreatePlace(candidate);
    await prisma.tripPlace.upsert({
      where: { tripId_placeId: { tripId: trip.id, placeId: place.id } },
      update: {},
      create: { tripId: trip.id, placeId: place.id, visitStatus: "candidate", memo: candidate.note ?? null },
    });
  }

  console.log(`시드 완료: ${data.title} (일정 ${data.days.length}일)`);
}

async function main() {
  await seedOsakaTrip();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
