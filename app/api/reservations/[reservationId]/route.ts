import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = { ...body };
  if (body.reservationDate) data.reservationDate = new Date(body.reservationDate);
  if (body.useDate) data.useDate = new Date(body.useDate);
  if (body.cancelDeadline) data.cancelDeadline = new Date(body.cancelDeadline);
  const reservation = await prisma.reservation.update({ where: { id: reservationId }, data });
  return NextResponse.json(reservation);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await params;
  await prisma.reservation.delete({ where: { id: reservationId } });
  return NextResponse.json({ ok: true });
}
