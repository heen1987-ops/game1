import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlights } from "@/lib/duffel";
import { searchHotels } from "@/lib/agoda";
import { getRoute } from "@/lib/googleMaps";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { origin, destination, region, departureDate, returnDate, guests } = body;

  if (!origin || !destination || !region || !departureDate || !returnDate) {
    return NextResponse.json(
      { error: "origin, destination, region, departureDate, returnDate는 필수입니다." },
      { status: 400 }
    );
  }

  const nights = Math.max(
    1,
    Math.round((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / 86400000)
  );

  const [flights, hotels, curatedPlaces] = await Promise.all([
    searchFlights({ origin, destination, departureDate, returnDate }),
    searchHotels({ city: region, checkIn: departureDate, checkOut: returnDate, guests: guests ?? 1 }),
    prisma.place.findMany({
      where: { OR: [{ city: { contains: region } }, { country: { contains: region } }] },
      include: { guideContents: true },
      take: 10,
    }),
  ]);

  const routeLegs = [];
  for (let i = 0; i < Math.min(curatedPlaces.length - 1, 3); i++) {
    const leg = await getRoute(curatedPlaces[i].name, curatedPlaces[i + 1].name);
    routeLegs.push(leg);
  }

  const cheapestFlight = flights.length ? flights.reduce((a, b) => (a.priceAmount < b.priceAmount ? a : b)) : null;
  const cheapestHotel = hotels.length ? hotels.reduce((a, b) => (a.pricePerNight < b.pricePerNight ? a : b)) : null;
  const flightCost = cheapestFlight?.priceAmount ?? 0;
  const hotelCost = (cheapestHotel?.pricePerNight ?? 0) * nights;

  return NextResponse.json({
    nights,
    flights,
    hotels,
    curatedPlaces,
    routeLegs,
    costSummary: { currency: "KRW", flightCost, hotelCost, totalCost: flightCost + hotelCost },
    dataSourceNote:
      "항공/숙소 가격은 API 키가 없으면 (샌드박스) 표시가 붙은 예시 데이터입니다. 장소/코스는 장소 DB(Place/GuideContent)에 쌓인 실제 큐레이션 데이터입니다.",
  });
}
