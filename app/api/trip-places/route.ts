import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 장소를 여행에 연결(후보/일정에 추가)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const tripPlace = await prisma.tripPlace.upsert({
    where: { tripId_placeId: { tripId: body.tripId, placeId: body.placeId } },
    update: { visitStatus: body.visitStatus ?? "candidate", memo: body.memo ?? undefined },
    create: {
      tripId: body.tripId,
      placeId: body.placeId,
      priority: body.priority ?? 0,
      visitStatus: body.visitStatus ?? "candidate",
      memo: body.memo ?? null,
    },
  });
  return NextResponse.json(tripPlace, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { tripId, placeId } = await req.json();
  await prisma.tripPlace.delete({ where: { tripId_placeId: { tripId, placeId } } });
  return NextResponse.json({ ok: true });
}
