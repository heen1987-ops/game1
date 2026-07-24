import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const date = new Date(body.date);

  const itinerary = await prisma.itinerary.upsert({
    where: { tripId_date: { tripId: id, date } },
    update: {},
    create: { tripId: id, date, title: body.dayTitle ?? "" },
  });

  const maxSeq = await prisma.itineraryItem.aggregate({
    where: { itineraryId: itinerary.id },
    _max: { sequence: true },
  });

  const item = await prisma.itineraryItem.create({
    data: {
      itineraryId: itinerary.id,
      placeId: body.placeId ?? null,
      customPlaceName: body.customPlaceName ?? null,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      sequence: (maxSeq._max.sequence ?? -1) + 1,
      transportType: body.transportType ?? null,
      transportDetail: body.transportDetail ?? null,
      travelDuration: body.travelDuration ?? null,
      reservationRequired: body.reservationRequired ?? false,
      isAnchor: body.isAnchor ?? false,
      memo: body.memo ?? null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
