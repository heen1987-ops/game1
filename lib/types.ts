import { Prisma } from "@prisma/client";

// GET /api/trips/[id] 응답 형태 — 모든 탭 컴포넌트가 이 타입을 공유한다.
export type TripDetail = Prisma.TripGetPayload<{
  include: {
    tripPlaces: { include: { place: true } };
    itineraries: { include: { items: { include: { place: true } } } };
    accommodations: { include: { place: true } };
    reservations: true;
    expenses: true;
    checklists: true;
    travelLogs: { include: { place: true } };
  };
}>;

export type TripSummary = Prisma.TripGetPayload<{
  include: { _count: { select: { itineraries: true; reservations: true; checklists: true } } };
}>;

export type TripPlaceWithPlace = TripDetail["tripPlaces"][number];
export type ItineraryWithItems = TripDetail["itineraries"][number];
export type ItineraryItemWithPlace = ItineraryWithItems["items"][number];
export type AccommodationWithPlace = TripDetail["accommodations"][number];
export type ReservationRow = TripDetail["reservations"][number];
export type ExpenseRow = TripDetail["expenses"][number];
export type ChecklistRow = TripDetail["checklists"][number];
export type TravelLogWithPlace = TripDetail["travelLogs"][number];

export type PlaceRow = Prisma.PlaceGetPayload<Record<string, never>>;
