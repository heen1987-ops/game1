import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.checklistItem.create({
    data: {
      tripId: id,
      category: body.category ?? "local",
      itemName: body.itemName,
      priority: body.priority ?? 0,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
