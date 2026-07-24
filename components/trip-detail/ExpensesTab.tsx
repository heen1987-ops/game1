"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TripDetail, ExpenseRow } from "@/lib/types";
import { formatDate, formatMoney, EXPENSE_CATEGORY_LABELS } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState, Button, Input, Select } from "@/components/ui";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "현금",
  card: "카드",
  transfer: "계좌이체",
};

const SHARED_TYPE_LABELS: Record<string, string> = {
  personal: "개인",
  shared: "공동경비",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpensesTab({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(trip.currency);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [sharedType, setSharedType] = useState("personal");

  const expenses: ExpenseRow[] = [...trip.expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const categoryTotals: Record<string, number> = {};
  let total = 0;
  for (const expense of trip.expenses) {
    categoryTotals[expense.category] = (categoryTotals[expense.category] ?? 0) + expense.amount;
    total += expense.amount;
  }
  const budgetRatio = trip.budget ? Math.round((total / trip.budget) * 100) : null;

  function resetForm() {
    setDate(today());
    setCategory("food");
    setDescription("");
    setAmount("");
    setCurrency(trip.currency);
    setPaymentMethod("card");
    setSharedType("personal");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    try {
      await fetch(`/api/trips/${trip.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          description: description || undefined,
          amount: Number(amount),
          currency,
          paymentMethod,
          sharedType,
        }),
      });
      resetForm();
      setShowForm(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader title="지출 요약" />
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryTotals).map(([cat, sum]) => (
            <Badge key={cat} tone="neutral">
              {EXPENSE_CATEGORY_LABELS[cat] ?? cat} {formatMoney(sum, trip.currency)}
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-neutral-100 pt-3">
          <span className="text-sm font-bold text-neutral-800">총 지출</span>
          <span className="text-lg font-bold text-neutral-900">{formatMoney(total, trip.currency)}</span>
        </div>
        {budgetRatio !== null && (
          <p className="mt-1 text-right text-xs text-neutral-400">
            예산 대비 {budgetRatio}% ({formatMoney(trip.budget, trip.currency)})
          </p>
        )}
      </Card>

      <Card>
        <SectionHeader
          title="지출 내역"
          action={
            <Button variant="ghost" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "닫기" : "+ 지출 추가"}
            </Button>
          }
        />

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              type="text"
              placeholder="내용 (예: 저녁 식사)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="금액"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={0}
                step="any"
              />
              <Input
                type="text"
                placeholder="통화"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select value={sharedType} onChange={(e) => setSharedType(e.target.value)}>
                {Object.entries(SHARED_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={submitting}>
              저장
            </Button>
          </form>
        )}

        {expenses.length === 0 ? (
          <EmptyState>등록된 지출이 없습니다.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-400">
                  <th className="py-2 font-medium">날짜</th>
                  <th className="py-2 font-medium">카테고리</th>
                  <th className="py-2 font-medium">내용</th>
                  <th className="py-2 font-medium">금액</th>
                  <th className="py-2 font-medium">결제수단</th>
                  <th className="py-2 font-medium">구분</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-neutral-50 last:border-0">
                    <td className="py-2 whitespace-nowrap text-neutral-600">{formatDate(expense.date)}</td>
                    <td className="py-2">
                      <Badge tone="accent">{EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}</Badge>
                    </td>
                    <td className="py-2 text-neutral-700">{expense.description ?? "-"}</td>
                    <td className="py-2 whitespace-nowrap font-semibold text-neutral-900">
                      {formatMoney(expense.amount, expense.currency)}
                    </td>
                    <td className="py-2 text-neutral-500">
                      {expense.paymentMethod ? PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod : "-"}
                    </td>
                    <td className="py-2 text-neutral-500">{SHARED_TYPE_LABELS[expense.sharedType] ?? expense.sharedType}</td>
                    <td className="py-2 text-right">
                      <Button variant="danger" onClick={() => handleDelete(expense.id)}>
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
