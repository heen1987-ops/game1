import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const travelLog = await prisma.travelLog.create({
    data: {
      tripId: body.tripId,
      placeId: body.placeId ?? null,
      visitedAt: new Date(body.visitedAt),
      actualDuration: body.actualDuration ?? null,
      rating: body.rating ?? null,
      review: body.review ?? null,
      revisit: body.revisit ?? null,
    },
  });
  return NextResponse.json(travelLog, { status: 201 });
}
