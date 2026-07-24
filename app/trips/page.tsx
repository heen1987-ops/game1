"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, SectionHeader, Badge, EmptyState, Button, Input, Select, TextArea } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { TripSummary } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  planning: "계획중",
  confirmed: "확정",
  ongoing: "진행중",
  completed: "완료",
  cancelled: "취소",
};

const STATUS_TONES: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  planning: "neutral",
  confirmed: "accent",
  ongoing: "success",
  completed: "neutral",
  cancelled: "danger",
};

const TYPE_LABELS: Record<string, string> = {
  leisure: "여가",
  business: "출장",
  family: "가족",
  scouting: "답사",
};

type TripFormState = {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  country: string;
  city: string;
  budget: string;
  description: string;
};

const EMPTY_FORM: TripFormState = {
  name: "",
  type: "leisure",
  startDate: "",
  endDate: "",
  country: "",
  city: "",
  budget: "",
  description: "",
};

function TripCard({ trip }: { trip: TripSummary }) {
  const location = [trip.country, trip.city].filter(Boolean).join(" · ");
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-neutral-900">{trip.name}</h3>
          <Badge tone={STATUS_TONES[trip.status] ?? "neutral"}>{STATUS_LABELS[trip.status] ?? trip.status}</Badge>
        </div>
        <p className="text-sm text-neutral-500">{location || "-"}</p>
        <p className="mt-1 text-xs text-neutral-400">
          {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>일정 {trip._count.itineraries}</Badge>
          <Badge>예약 {trip._count.reservations}</Badge>
          <Badge>체크리스트 {trip._count.checklists}</Badge>
        </div>
      </Card>
    </Link>
  );
}

function TripGrid({ trips }: { trips: TripSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<TripFormState>(EMPTY_FORM);

  async function fetchTrips() {
    setLoading(true);
    const res = await fetch("/api/trips");
    const data: TripSummary[] = await res.json();
    setTrips(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchTrips();
  }, []);

  function updateForm<K extends keyof TripFormState>(key: K, value: TripFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        country: form.country || undefined,
        city: form.city || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        description: form.description || undefined,
      }),
    });
    setSubmitting(false);
    setForm(EMPTY_FORM);
    setShowForm(false);
    await fetchTrips();
    router.refresh();
  }

  const activeTrips = trips.filter((t) => t.status === "planning" || t.status === "confirmed" || t.status === "ongoing");
  const completedTrips = trips.filter((t) => t.status === "completed");
  const cancelledTrips = trips.filter((t) => t.status === "cancelled");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">내 여행</h1>
        <Button onClick={() => setShowForm((prev) => !prev)}>{showForm ? "닫기" : "+ 새 여행"}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <SectionHeader title="새 여행 만들기" />
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-500">여행 이름</label>
              <Input
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="예: 도쿄 벚꽃 여행"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">유형</label>
              <Select value={form.type} onChange={(e) => updateForm("type", e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">예산</label>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => updateForm("budget", e.target.value)}
                placeholder="예: 1500000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">시작일</label>
              <Input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">종료일</label>
              <Input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">국가</label>
              <Input value={form.country} onChange={(e) => updateForm("country", e.target.value)} placeholder="예: 일본" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">도시</label>
              <Input value={form.city} onChange={(e) => updateForm("city", e.target.value)} placeholder="예: 도쿄" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-500">설명</label>
              <TextArea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={3}
                placeholder="여행에 대한 메모"
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <EmptyState>불러오는 중...</EmptyState>
      ) : trips.length === 0 ? (
        <EmptyState>아직 등록된 여행이 없어요. 새 여행을 만들어보세요.</EmptyState>
      ) : (
        <div className="flex flex-col gap-8">
          {activeTrips.length > 0 && (
            <section>
              <SectionHeader title="진행중 · 예정" />
              <TripGrid trips={activeTrips} />
            </section>
          )}
          {completedTrips.length > 0 && (
            <section>
              <SectionHeader title="완료" />
              <TripGrid trips={completedTrips} />
            </section>
          )}
          {cancelledTrips.length > 0 && (
            <section>
              <SectionHeader title="취소" />
              <TripGrid trips={cancelledTrips} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
