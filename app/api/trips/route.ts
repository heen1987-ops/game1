import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const trips = await prisma.trip.findMany({
    orderBy: { startDate: "asc" },
    include: {
      _count: { select: { itineraries: true, reservations: true, checklists: true } },
    },
  });
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const trip = await prisma.trip.create({
    data: {
      name: body.name,
      type: body.type ?? "leisure",
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      country: body.country ?? null,
      city: body.city ?? null,
      status: body.status ?? "planning",
      budget: body.budget ?? null,
      currency: body.currency ?? "KRW",
      description: body.description ?? null,
    },
  });
  return NextResponse.json(trip, { status: 201 });
}
