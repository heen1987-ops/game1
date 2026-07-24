"use client";

import { useState } from "react";
import { TripDetail } from "@/lib/types";
import { formatDate, dDay } from "@/lib/format";
import OverviewTab from "./OverviewTab";
import ItineraryTab from "./ItineraryTab";
import PlacesTab from "./PlacesTab";
import ReservationsTab from "./ReservationsTab";
import ExpensesTab from "./ExpensesTab";
import ChecklistTab from "./ChecklistTab";
import LogTab from "./LogTab";

const TABS = [
  { key: "overview", label: "개요" },
  { key: "itinerary", label: "일정" },
  { key: "places", label: "장소" },
  { key: "reservations", label: "예약" },
  { key: "expenses", label: "비용" },
  { key: "checklist", label: "준비물" },
  { key: "log", label: "기록" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function TripDetailClient({ trip }: { trip: TripDetail }) {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{trip.country ?? ""} {trip.city ?? ""}</span>
          <span>·</span>
          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-semibold text-white">
            {dDay(trip.startDate)}
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">{trip.name}</h1>
        {trip.description && <p className="mt-1 text-sm text-neutral-500">{trip.description}</p>}
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab trip={trip} />}
      {tab === "itinerary" && <ItineraryTab trip={trip} />}
      {tab === "places" && <PlacesTab trip={trip} />}
      {tab === "reservations" && <ReservationsTab trip={trip} />}
      {tab === "expenses" && <ExpensesTab trip={trip} />}
      {tab === "checklist" && <ChecklistTab trip={trip} />}
      {tab === "log" && <LogTab trip={trip} />}
    </div>
  );
}
