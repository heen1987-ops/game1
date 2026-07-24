"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TripDetail } from "@/lib/types";
import { formatDate, formatMoney, mapUrl } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState, Select, TextArea } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  planning: "계획 중",
  confirmed: "확정",
  ongoing: "진행 중",
  completed: "완료",
  cancelled: "취소됨",
};

const STATUS_TONES: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  planning: "neutral",
  confirmed: "accent",
  ongoing: "warning",
  completed: "success",
  cancelled: "danger",
};

export default function OverviewTab({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [status, setStatus] = useState(trip.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [description, setDescription] = useState(trip.description ?? "");
  const [savingDescription, setSavingDescription] = useState(false);

  async function handleStatusChange(nextStatus: string) {
    setStatus(nextStatus);
    setSavingStatus(true);
    try {
      await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDescriptionBlur() {
    if (description === (trip.description ?? "")) return;
    setSavingDescription(true);
    try {
      await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      router.refresh();
    } finally {
      setSavingDescription(false);
    }
  }

  const totalExpense = trip.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const hasBudget = trip.budget !== null && trip.budget !== undefined && trip.budget > 0;
  const budgetRatio = hasBudget ? Math.min((totalExpense / (trip.budget as number)) * 100, 100) : 0;
  const overBudget = hasBudget && totalExpense > (trip.budget as number);

  const checklistTotal = trip.checklists.length;
  const checklistDone = trip.checklists.filter((item) => item.isCompleted).length;
  const checklistRatio = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader
          title="여행 상태"
          action={<Badge tone={STATUS_TONES[status] ?? "neutral"}>{STATUS_LABELS[status] ?? status}</Badge>}
        />
        <Select
          value={status}
          disabled={savingStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Card>

      <Card>
        <SectionHeader title="숙소" />
        {trip.accommodations.length === 0 ? (
          <EmptyState>등록된 숙소가 없습니다.</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {trip.accommodations.map((accommodation) => (
              <div key={accommodation.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-800">{accommodation.name}</span>
                  <Badge>{accommodation.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatDate(accommodation.checkIn)} - {formatDate(accommodation.checkOut)}
                </p>
                {accommodation.reservationNumber && (
                  <p className="mt-1 text-xs text-neutral-400">예약번호 {accommodation.reservationNumber}</p>
                )}
                {accommodation.place && (
                  <a
                    href={mapUrl(accommodation.place.mapQuery ?? accommodation.place.address ?? accommodation.place.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-orange-600 hover:underline"
                  >
                    지도에서 보기
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="예산" />
        {!hasBudget ? (
          <EmptyState>예산 미설정</EmptyState>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{formatMoney(totalExpense, trip.currency)} 지출</span>
              <span>{formatMoney(trip.budget, trip.currency)} 예산</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${overBudget ? "bg-red-500" : "bg-neutral-900"}`}
                style={{ width: `${budgetRatio}%` }}
              />
            </div>
            {overBudget && <p className="mt-1 text-xs font-medium text-red-500">예산을 초과했습니다.</p>}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="준비물 진행률" />
        {checklistTotal === 0 ? (
          <EmptyState>등록된 준비물이 없습니다.</EmptyState>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{checklistDone} / {checklistTotal} 완료</span>
              <span>{checklistRatio}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-neutral-900" style={{ width: `${checklistRatio}%` }} />
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-neutral-400">준비물 탭에서 관리</p>
      </Card>

      <Card>
        <SectionHeader title="메모" />
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          disabled={savingDescription}
          rows={4}
          placeholder="여행에 대한 메모를 남겨보세요."
        />
      </Card>
    </div>
  );
}
