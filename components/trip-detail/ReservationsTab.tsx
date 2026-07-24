"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TripDetail, ReservationRow } from "@/lib/types";
import { formatDate, formatMoney, RESERVATION_TYPE_LABELS } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState, Button, Input, Select, TextArea } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "확정",
  pending: "대기",
  cancelled: "취소",
};

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "confirmed") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

type FormState = {
  type: string;
  title: string;
  provider: string;
  reservationNumber: string;
  reservationDate: string;
  useDate: string;
  amount: string;
  currency: string;
  cancelDeadline: string;
  memo: string;
};

const INITIAL_FORM: FormState = {
  type: "flight",
  title: "",
  provider: "",
  reservationNumber: "",
  reservationDate: "",
  useDate: "",
  amount: "",
  currency: "KRW",
  cancelDeadline: "",
  memo: "",
};

export default function ReservationsTab({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const reservations: ReservationRow[] = [...trip.reservations].sort((a, b) => {
    if (!a.useDate && !b.useDate) return 0;
    if (!a.useDate) return 1;
    if (!b.useDate) return -1;
    return new Date(a.useDate).getTime() - new Date(b.useDate).getTime();
  });

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function deleteReservation(id: string) {
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/trips/${trip.id}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          provider: form.provider || undefined,
          reservationNumber: form.reservationNumber || undefined,
          reservationDate: form.reservationDate || undefined,
          useDate: form.useDate || undefined,
          amount: form.amount ? Number(form.amount) : undefined,
          currency: form.currency || undefined,
          cancelDeadline: form.cancelDeadline || undefined,
          memo: form.memo || undefined,
        }),
      });
      setForm(INITIAL_FORM);
      setShowForm(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <SectionHeader
        title="예약"
        action={
          <Button variant="ghost" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "닫기" : "+ 예약 추가"}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 p-3">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(RESERVATION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            placeholder="예약처"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          />
          <Input
            placeholder="예약번호"
            value={form.reservationNumber}
            onChange={(e) => setForm({ ...form, reservationNumber: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-xs text-neutral-500">예약일</label>
            <Input
              type="date"
              value={form.reservationDate}
              onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">이용일</label>
            <Input type="date" value={form.useDate} onChange={(e) => setForm({ ...form, useDate: e.target.value })} />
          </div>
          <Input
            type="number"
            placeholder="금액"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Input
            placeholder="통화"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-xs text-neutral-500">취소기한</label>
            <Input
              type="date"
              value={form.cancelDeadline}
              onChange={(e) => setForm({ ...form, cancelDeadline: e.target.value })}
            />
          </div>
          <TextArea
            className="col-span-2"
            placeholder="메모"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              취소
            </Button>
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              추가
            </Button>
          </div>
        </form>
      )}

      {reservations.length === 0 ? (
        <EmptyState>등록된 예약이 없습니다.</EmptyState>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{RESERVATION_TYPE_LABELS[r.type] ?? r.type}</Badge>
                    <span className="text-sm font-semibold text-neutral-800">{r.title}</span>
                    <Badge tone={statusTone(r.status)}>{STATUS_LABELS[r.status] ?? r.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {r.provider && <span>{r.provider}</span>}
                    {r.reservationNumber && <span>{r.provider ? " · " : ""}예약번호 {r.reservationNumber}</span>}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {r.useDate && <span>이용일 {formatDate(r.useDate)}</span>}
                    {r.amount != null && <span>{r.useDate ? " · " : ""}{formatMoney(r.amount, r.currency)}</span>}
                  </div>
                  {r.cancelDeadline && (
                    <p className="mt-1 text-xs font-medium text-red-600">취소기한: {formatDate(r.cancelDeadline)}</p>
                  )}
                  {r.memo && <p className="mt-1 text-xs text-neutral-400">{r.memo}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Select
                    className="w-24"
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Button variant="danger" onClick={() => deleteReservation(r.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
