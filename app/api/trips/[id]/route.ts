import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      tripPlaces: { include: { place: true }, orderBy: { priority: "desc" } },
      itineraries: {
        orderBy: { date: "asc" },
        include: { items: { orderBy: { sequence: "asc" }, include: { place: true } } },
      },
      accommodations: { include: { place: true }, orderBy: { checkIn: "asc" } },
      reservations: { orderBy: { useDate: "asc" } },
      expenses: { orderBy: { date: "asc" } },
      checklists: { orderBy: [{ category: "asc" }, { priority: "desc" }] },
      travelLogs: { include: { place: true } },
    },
  });
  if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(trip);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = { ...body };
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate) data.endDate = new Date(body.endDate);
  const trip = await prisma.trip.update({ where: { id }, data });
  return NextResponse.json(trip);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
