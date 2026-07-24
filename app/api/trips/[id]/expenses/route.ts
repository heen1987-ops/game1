import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      tripId: id,
      date: new Date(body.date),
      category: body.category,
      description: body.description ?? null,
      amount: body.amount,
      currency: body.currency ?? "KRW",
      exchangeRate: body.exchangeRate ?? null,
      paymentMethod: body.paymentMethod ?? null,
      sharedType: body.sharedType ?? "personal",
    },
  });
  return NextResponse.json(expense, { status: 201 });
}
