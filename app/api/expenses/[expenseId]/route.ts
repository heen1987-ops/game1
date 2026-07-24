import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = { ...body };
  if (body.date) data.date = new Date(body.date);
  const expense = await prisma.expense.update({ where: { id: expenseId }, data });
  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  await prisma.expense.delete({ where: { id: expenseId } });
  return NextResponse.json({ ok: true });
}
