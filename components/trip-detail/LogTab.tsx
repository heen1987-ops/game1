"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TripDetail, TravelLogWithPlace } from "@/lib/types";
import { formatDate, formatDateISO } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState, Button, Input, Select, TextArea } from "@/components/ui";

function ratingStars(rating: number | null) {
  if (!rating) return null;
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}

export default function LogTab({ trip }: { trip: TripDetail }) {
  const logs = [...trip.travelLogs].sort((a, b) => {
    const at = a.visitedAt ? new Date(a.visitedAt).getTime() : 0;
    const bt = b.visitedAt ? new Date(b.visitedAt).getTime() : 0;
    return bt - at;
  });

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader title="여행 기록" />
        <AddLogForm trip={trip} />
      </Card>

      {logs.length === 0 ? (
        <Card>
          <EmptyState>등록된 여행 기록이 없습니다.</EmptyState>
        </Card>
      ) : (
        <Card>
          <ul className="space-y-2">
            {logs.map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function LogCard({ log }: { log: TravelLogWithPlace }) {
  const stars = ratingStars(log.rating);
  const hasRevisit = log.revisit !== null && log.revisit !== undefined;

  return (
    <li className="rounded-lg border border-neutral-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800">
            {log.place?.name ?? "장소 미지정"}
          </span>
          {stars && <span className="text-xs text-amber-500">{stars}</span>}
        </div>
        {log.visitedAt && (
          <span className="text-xs text-neutral-400">{formatDate(log.visitedAt)}</span>
        )}
      </div>

      {(log.actualDuration != null || hasRevisit) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {log.actualDuration != null && <Badge>체류 {log.actualDuration}분</Badge>}
          {hasRevisit && (
            <Badge tone={log.revisit ? "success" : "neutral"}>
              {log.revisit ? "재방문 의사 있음" : "재방문 의사 없음"}
            </Badge>
          )}
        </div>
      )}

      {log.review && <p className="mt-2 text-sm text-neutral-600">{log.review}</p>}
    </li>
  );
}

function AddLogForm({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [placeId, setPlaceId] = useState("");
  const [visitedAt, setVisitedAt] = useState(formatDateISO(new Date()));
  const [actualDuration, setActualDuration] = useState("");
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [revisit, setRevisit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!visitedAt) return;
    setSubmitting(true);
    await fetch("/api/travel-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId: trip.id,
        placeId: placeId || undefined,
        visitedAt,
        actualDuration: actualDuration ? Number(actualDuration) : undefined,
        rating: rating ? Number(rating) : undefined,
        review: review || undefined,
        revisit,
      }),
    });
    setSubmitting(false);
    setPlaceId("");
    setVisitedAt(formatDateISO(new Date()));
    setActualDuration("");
    setRating("");
    setReview("");
    setRevisit(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        + 기록 추가
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-100 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Select value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
          <option value="">장소 없음</option>
          {trip.tripPlaces.map((tp) => (
            <option key={tp.placeId} value={tp.placeId}>
              {tp.place.name}
            </option>
          ))}
        </Select>
        <Input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="체류 시간 (분)"
          value={actualDuration}
          onChange={(e) => setActualDuration(e.target.value)}
        />
        <Select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">평가 안함</option>
          <option value="1">★☆☆☆☆</option>
          <option value="2">★★☆☆☆</option>
          <option value="3">★★★☆☆</option>
          <option value="4">★★★★☆</option>
          <option value="5">★★★★★</option>
        </Select>
      </div>
      <TextArea
        placeholder="후기"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={3}
      />
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={revisit}
          onChange={(e) => setRevisit(e.target.checked)}
          className="h-4 w-4 accent-neutral-900"
        />
        재방문 의사 있음
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !visitedAt}>
          추가
        </Button>
      </div>
    </div>
  );
}
