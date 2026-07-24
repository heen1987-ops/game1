"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TripDetail, TripPlaceWithPlace, PlaceRow } from "@/lib/types";
import { CATEGORY_LABELS, mapUrl } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState, Button, Input, Select } from "@/components/ui";

const VISIT_STATUS_ORDER = ["candidate", "planned", "visited", "skipped"] as const;

const VISIT_STATUS_LABELS: Record<string, string> = {
  candidate: "후보",
  planned: "방문 예정",
  visited: "방문 완료",
  skipped: "건너뜀",
};

export default function PlacesTab({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [linkOpen, setLinkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const grouped = VISIT_STATUS_ORDER.map((status) => ({
    status,
    items: trip.tripPlaces.filter((tp) => tp.visitStatus === status),
  }));

  async function changeVisitStatus(tp: TripPlaceWithPlace, visitStatus: string) {
    await fetch("/api/trip-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: trip.id, placeId: tp.placeId, visitStatus }),
    });
    router.refresh();
  }

  async function unlinkPlace(placeId: string) {
    await fetch("/api/trip-places", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: trip.id, placeId }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader title="장소 연결" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setLinkOpen((v) => !v);
              setCreateOpen(false);
            }}
          >
            + 기존 장소 연결
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCreateOpen((v) => !v);
              setLinkOpen(false);
            }}
          >
            + 새 장소 만들어서 연결
          </Button>
        </div>
        {linkOpen && (
          <div className="mt-3">
            <LinkExistingPlaceForm tripId={trip.id} onDone={() => setLinkOpen(false)} />
          </div>
        )}
        {createOpen && (
          <div className="mt-3">
            <CreatePlaceForm tripId={trip.id} onDone={() => setCreateOpen(false)} />
          </div>
        )}
      </Card>

      {grouped.map((group) => (
        <Card key={group.status}>
          <SectionHeader title={`${VISIT_STATUS_LABELS[group.status]} (${group.items.length})`} />
          {group.items.length === 0 ? (
            <EmptyState>등록된 장소가 없습니다.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {group.items.map((tp) => (
                <li
                  key={tp.id}
                  className="flex flex-col gap-2 rounded-lg border border-neutral-100 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800">{tp.place.name}</span>
                      <Badge>{CATEGORY_LABELS[tp.place.category] ?? tp.place.category}</Badge>
                    </div>
                    {tp.memo && <p className="mt-0.5 text-xs text-neutral-400">{tp.memo}</p>}
                    <a
                      href={mapUrl(tp.place.mapQuery || tp.place.address || tp.place.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-block text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
                    >
                      지도에서 보기
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={tp.visitStatus}
                      onChange={(e) => changeVisitStatus(tp, e.target.value)}
                      className="w-auto"
                    >
                      {VISIT_STATUS_ORDER.map((status) => (
                        <option key={status} value={status}>
                          {VISIT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </Select>
                    <Button variant="danger" onClick={() => unlinkPlace(tp.placeId)}>
                      연결 해제
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}

function LinkExistingPlaceForm({ tripId, onDone }: { tripId: string; onDone: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/places?q=${encodeURIComponent(query.trim())}`);
      const data: PlaceRow[] = await res.json();
      setResults(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function linkPlace(placeId: string) {
    setLinkingId(placeId);
    await fetch("/api/trip-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, placeId, visitStatus: "candidate" }),
    });
    setLinkingId(null);
    setQuery("");
    setResults([]);
    router.refresh();
    onDone();
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-100 p-3">
      <Input placeholder="장소 이름으로 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
      {loading && <p className="text-xs text-neutral-400">검색 중...</p>}
      {!loading && query.trim() && results.length === 0 && (
        <p className="text-xs text-neutral-400">검색 결과가 없습니다.</p>
      )}
      {results.length > 0 && (
        <ul className="max-h-56 space-y-1 overflow-y-auto">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => linkPlace(place.id)}
                disabled={linkingId === place.id}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-100 disabled:opacity-40"
              >
                <span>
                  {place.name}
                  <span className="ml-2 text-xs text-neutral-400">
                    {CATEGORY_LABELS[place.category] ?? place.category}
                  </span>
                </span>
                <span className="text-xs text-neutral-400">{place.city ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreatePlaceForm({ tripId, onDone }: { tripId: string; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("landmark");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), category }),
    });
    const place: PlaceRow = await res.json();
    await fetch("/api/trip-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, placeId: place.id, visitStatus: "candidate" }),
    });
    setSubmitting(false);
    setName("");
    setCategory("landmark");
    router.refresh();
    onDone();
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-100 p-3">
      <Input placeholder="장소 이름" value={name} onChange={(e) => setName(e.target.value)} />
      <Select value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
          만들고 연결
        </Button>
      </div>
    </div>
  );
}
