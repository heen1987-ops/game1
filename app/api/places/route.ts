import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const category = req.nextUrl.searchParams.get("category");
  const places = await prisma.place.findMany({
    where: {
      AND: [
        q ? { name: { contains: q } } : {},
        category ? { category } : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(places);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const place = await prisma.place.create({
    data: {
      name: body.name,
      country: body.country ?? null,
      city: body.city ?? null,
      category: body.category ?? "other",
      address: body.address ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      openingHours: body.openingHours ?? null,
      estimatedDuration: body.estimatedDuration ?? null,
      websiteUrl: body.websiteUrl ?? null,
      mapQuery: body.mapQuery ?? null,
      description: body.description ?? null,
      personalRating: body.personalRating ?? null,
    },
  });
  return NextResponse.json(place, { status: 201 });
}
