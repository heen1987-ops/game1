"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TripDetail, ItineraryItemWithPlace } from "@/lib/types";
import { formatDate, formatDateISO, mapUrl } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState, Button, Input, Select, TextArea } from "@/components/ui";

const TRANSPORT_LABELS: Record<string, string> = {
  walk: "🚶 도보",
  subway: "🚇 지하철",
  train: "🚆 기차",
  bus: "🚌 버스",
  car: "🚗 자동차",
  flight: "✈️ 비행기",
};

function buildDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  cur.setUTCHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setUTCHours(0, 0, 0, 0);
  while (cur.getTime() <= last.getTime()) {
    dates.push(formatDateISO(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function itemMapHref(item: ItineraryItemWithPlace): string | null {
  if (item.place) return mapUrl(item.place.mapQuery ?? item.place.name);
  if (item.customPlaceName) return mapUrl(item.customPlaceName);
  return null;
}

export default function ItineraryTab({ trip }: { trip: TripDetail }) {
  const router = useRouter();

  const dateList = useMemo(
    () => buildDateRange(new Date(trip.startDate), new Date(trip.endDate)),
    [trip.startDate, trip.endDate]
  );
  const [selectedDate, setSelectedDate] = useState<string>(dateList[0] ?? "");
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [placeId, setPlaceId] = useState("");
  const [customPlaceName, setCustomPlaceName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [transportType, setTransportType] = useState("");
  const [transportDetail, setTransportDetail] = useState("");
  const [memo, setMemo] = useState("");
  const [isAnchor, setIsAnchor] = useState(false);

  const itinerary = trip.itineraries.find((it) => formatDateISO(it.date) === selectedDate);
  const items: ItineraryItemWithPlace[] = itinerary
    ? [...itinerary.items].sort((a, b) => a.sequence - b.sequence)
    : [];

  const latLngCount = items.filter((item) => item.place?.lat != null && item.place?.lng != null).length;
  const canShowMap = latLngCount >= 2;

  const mapEmbedUrl = useMemo(() => {
    const points = items
      .map((item) => {
        if (item.place?.lat != null && item.place?.lng != null) return `${item.place.lat},${item.place.lng}`;
        if (item.place?.mapQuery) return encodeURIComponent(item.place.mapQuery);
        return null;
      })
      .filter((p): p is string => p !== null);
    return points.length >= 2
      ? `https://www.google.com/maps/dir/${points.join("/")}/?travelmode=walking&output=embed`
      : "";
  }, [items]);

  function resetForm() {
    setPlaceId("");
    setCustomPlaceName("");
    setStartTime("");
    setTransportType("");
    setTransportDetail("");
    setMemo("");
    setIsAnchor(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!placeId && !customPlaceName.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/trips/${trip.id}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(selectedDate).toISOString(),
          placeId: placeId || undefined,
          customPlaceName: placeId ? undefined : customPlaceName.trim(),
          startTime: startTime || undefined,
          transportType: transportType || undefined,
          transportDetail: transportDetail || undefined,
          memo: memo || undefined,
          isAnchor,
        }),
      });
      resetForm();
      setShowForm(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(itemId: string) {
    await fetch(`/api/itinerary-items/${itemId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          {dateList.map((d, idx) => (
            <button
              key={d}
              onClick={() => {
                setSelectedDate(d);
                setShowForm(false);
                setShowMap(false);
              }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedDate === d
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Day {idx + 1} · {formatDate(d, { month: "numeric", day: "numeric", weekday: "short" })}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader
          title={selectedDate ? `${formatDate(selectedDate)} 일정` : "일정"}
          action={
            <div className="flex gap-2">
              {canShowMap && (
                <Button variant="ghost" onClick={() => setShowMap((v) => !v)}>
                  🗺️ 지도로 보기
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  setShowForm((v) => !v);
                  if (showForm) resetForm();
                }}
              >
                {showForm ? "닫기" : "+ 장소 추가"}
              </Button>
            </div>
          }
        />

        {showMap && canShowMap && mapEmbedUrl && (
          <div className="mb-4 overflow-hidden rounded-lg border border-neutral-200">
            <iframe
              src={mapEmbedUrl}
              className="h-80 w-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="일정 경로 지도"
            />
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 space-y-2 rounded-lg border border-neutral-200 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-neutral-500">기존 장소에서 선택</label>
                <Select value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
                  <option value="">직접 입력</option>
                  {trip.tripPlaces.map((tp) => (
                    <option key={tp.id} value={tp.placeId}>
                      {tp.place.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-500">직접 입력</label>
                <Input
                  value={customPlaceName}
                  onChange={(e) => setCustomPlaceName(e.target.value)}
                  placeholder="장소명 직접 입력"
                  disabled={!!placeId}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-neutral-500">시작 시간</label>
                <Input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="예: 09:00 또는 오후"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-500">이동 수단</label>
                <Select value={transportType} onChange={(e) => setTransportType(e.target.value)}>
                  <option value="">선택 안 함</option>
                  <option value="walk">🚶 도보</option>
                  <option value="subway">🚇 지하철</option>
                  <option value="train">🚆 기차</option>
                  <option value="bus">🚌 버스</option>
                  <option value="car">🚗 자동차</option>
                  <option value="flight">✈️ 비행기</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">이동 상세</label>
              <Input
                value={transportDetail}
                onChange={(e) => setTransportDetail(e.target.value)}
                placeholder="예: 2호선 환승 1회"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">메모</label>
              <TextArea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={isAnchor}
                onChange={(e) => setIsAnchor(e.target.checked)}
              />
              🔒 고정 일정 (시간 변경 불가)
            </label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                추가
              </Button>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <EmptyState>아직 등록된 일정이 없습니다.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) => {
              const href = itemMapHref(item);
              return (
                <li key={item.id}>
                  {idx > 0 && item.transportType && (
                    <div className="flex items-center gap-2 py-1 pl-2 text-xs text-neutral-400">
                      <span className="h-4 w-px bg-neutral-200" />
                      <span>
                        {TRANSPORT_LABELS[item.transportType] ?? item.transportType}
                        {item.transportDetail ? ` · ${item.transportDetail}` : ""}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.startTime && (
                          <span className="text-xs font-semibold text-neutral-500">{item.startTime}</span>
                        )}
                        <span className="text-sm font-semibold text-neutral-800">
                          {item.place?.name ?? item.customPlaceName ?? "이름 없음"}
                        </span>
                        {item.isAnchor && <Badge tone="accent">🔒 고정</Badge>}
                      </div>
                      {item.memo && <p className="mt-1 text-xs text-neutral-500">{item.memo}</p>}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                        >
                          지도에서 보기
                        </a>
                      )}
                    </div>
                    <Button variant="danger" onClick={() => handleDelete(item.id)}>
                      삭제
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
