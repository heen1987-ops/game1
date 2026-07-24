"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlaceRow } from "@/lib/types";
import { CATEGORY_LABELS, mapUrl } from "@/lib/format";
import { Badge, Button, Card, EmptyState, Input, Select, SectionHeader, TextArea } from "@/components/ui";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS);

const CATEGORY_BADGE_TONES: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  landmark: "accent",
  restaurant: "warning",
  cafe: "warning",
  shopping: "success",
  hotel: "accent",
  airport: "neutral",
  station: "neutral",
  convenience: "neutral",
  hospital: "danger",
  other: "neutral",
};

type NewPlaceForm = {
  name: string;
  category: string;
  country: string;
  city: string;
  address: string;
  lat: string;
  lng: string;
  mapQuery: string;
  description: string;
};

const EMPTY_FORM: NewPlaceForm = {
  name: "",
  category: "landmark",
  country: "",
  city: "",
  address: "",
  lat: "",
  lng: "",
  mapQuery: "",
  description: "",
};

export default function PlacesPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewPlaceForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function loadPlaces() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    const res = await fetch(`/api/places?${params.toString()}`);
    const data: PlaceRow[] = await res.json();
    setPlaces(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPlaces();
  }, [query, category]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        country: form.country || null,
        city: form.city || null,
        address: form.address || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        mapQuery: form.mapQuery || null,
        description: form.description || null,
      }),
    });
    setSubmitting(false);
    setForm(EMPTY_FORM);
    setShowForm(false);
    router.refresh();
    await loadPlaces();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-neutral-900">장소 데이터베이스</h1>
        <p className="mt-1 text-sm text-neutral-500">여행에 종속되지 않는 공통 장소 정보를 관리합니다.</p>
      </div>

      <Card className="mb-5">
        <SectionHeader
          title="검색"
          action={
            <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "닫기" : "+ 새 장소"}</Button>
          }
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="장소 이름 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="sm:w-48"
          >
            <option value="">전체</option>
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="이름 *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="국가"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
              <Input
                placeholder="도시"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                placeholder="주소"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                placeholder="위도 (lat)"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
              <Input
                placeholder="경도 (lng)"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
              <Input
                placeholder="지도 검색어 (mapQuery)"
                value={form.mapQuery}
                onChange={(e) => setForm({ ...form, mapQuery: e.target.value })}
                className="sm:col-span-2"
              />
            </div>
            <TextArea
              placeholder="설명"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                저장
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <SectionHeader title={loading ? "장소 목록" : `장소 목록 (${places.length})`} />
        {loading ? (
          <p className="py-8 text-center text-sm text-neutral-400">불러오는 중...</p>
        ) : places.length === 0 ? (
          <EmptyState>등록된 장소가 없습니다.</EmptyState>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {places.map((place) => (
              <li key={place.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-neutral-800">{place.name}</span>
                    <Badge tone={CATEGORY_BADGE_TONES[place.category] ?? "neutral"}>
                      {CATEGORY_LABELS[place.category] ?? place.category}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    {place.city && <span>{place.city}</span>}
                    {place.personalRating != null && (
                      <span>
                        {"★".repeat(place.personalRating)}
                        {"☆".repeat(5 - place.personalRating)} ({place.personalRating}/5)
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={mapUrl(place.mapQuery ?? place.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-neutral-500 hover:text-neutral-800"
                >
                  지도에서 보기
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
