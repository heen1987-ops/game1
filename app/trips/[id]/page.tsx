import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TripDetailClient from "@/components/trip-detail/TripDetailClient";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!trip) notFound();

  return <TripDetailClient trip={trip} />;
}
