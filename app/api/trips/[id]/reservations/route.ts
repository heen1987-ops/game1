import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const reservation = await prisma.reservation.create({
    data: {
      tripId: id,
      type: body.type,
      title: body.title,
      provider: body.provider ?? null,
      reservationNumber: body.reservationNumber ?? null,
      reservationDate: body.reservationDate ? new Date(body.reservationDate) : null,
      useDate: body.useDate ? new Date(body.useDate) : null,
      amount: body.amount ?? null,
      currency: body.currency ?? "KRW",
      cancelDeadline: body.cancelDeadline ? new Date(body.cancelDeadline) : null,
      status: body.status ?? "confirmed",
      attachmentUrl: body.attachmentUrl ?? null,
      memo: body.memo ?? null,
    },
  });
  return NextResponse.json(reservation, { status: 201 });
}
