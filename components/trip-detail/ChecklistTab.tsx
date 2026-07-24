"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TripDetail, ChecklistRow } from "@/lib/types";
import { CHECKLIST_CATEGORY_LABELS, formatDate } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState, Button, Input, Select } from "@/components/ui";

export default function ChecklistTab({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const categories = Object.keys(CHECKLIST_CATEGORY_LABELS);

  const grouped = categories
    .map((category) => {
      const items = trip.checklists
        .filter((c) => c.category === category)
        .sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
          return b.priority - a.priority;
        });
      return { category, items };
    })
    .filter((g) => g.items.length > 0);

  async function toggleCompleted(item: ChecklistRow) {
    await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !item.isCompleted }),
    });
    router.refresh();
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/checklist/${itemId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader title="준비물 체크리스트" />
        <AddChecklistItemForm tripId={trip.id} />
      </Card>

      {grouped.length === 0 ? (
        <Card>
          <EmptyState>등록된 체크리스트 항목이 없습니다.</EmptyState>
        </Card>
      ) : (
        grouped.map((group) => {
          const completedCount = group.items.filter((i) => i.isCompleted).length;
          return (
            <Card key={group.category}>
              <SectionHeader
                title={CHECKLIST_CATEGORY_LABELS[group.category]}
                action={
                  <span className="text-xs text-neutral-400">
                    완료 {completedCount}/{group.items.length}
                  </span>
                }
              />
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-neutral-100 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={() => toggleCompleted(item)}
                      className="h-4 w-4 shrink-0 accent-neutral-900"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            item.isCompleted
                              ? "text-sm text-neutral-400 line-through"
                              : "text-sm text-neutral-800"
                          }
                        >
                          {item.itemName}
                        </span>
                        {item.priority >= 2 && <Badge tone="danger">중요</Badge>}
                      </div>
                      {item.dueDate && (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          기한 {formatDate(item.dueDate)}
                        </p>
                      )}
                    </div>
                    <Button variant="danger" onClick={() => deleteItem(item.id)}>
                      삭제
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}

function AddChecklistItemForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("document");
  const [itemName, setItemName] = useState("");
  const [priority, setPriority] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!itemName.trim()) return;
    setSubmitting(true);
    await fetch(`/api/trips/${tripId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        itemName,
        priority: Number(priority),
        dueDate: dueDate || undefined,
      }),
    });
    setSubmitting(false);
    setItemName("");
    setPriority("0");
    setDueDate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        + 항목 추가
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-100 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(CHECKLIST_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="0">일반</option>
          <option value="1">보통</option>
          <option value="2">중요</option>
        </Select>
      </div>
      <Input
        placeholder="항목명 (예: 여권)"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
      />
      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !itemName.trim()}>
          추가
        </Button>
      </div>
    </div>
  );
}
