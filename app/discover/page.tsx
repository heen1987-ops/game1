"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Select, SectionHeader } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";

type TripOption = { id: string; name: string };

type DiscoverResult = {
  nights: number;
  flights: Array<{ id: string; airline: string; priceAmount: number; priceCurrency: string; isMock: boolean }>;
  hotels: Array<{ id: string; name: string; pricePerNight: number; currency: string; rating: number; isMock: boolean }>;
  curatedPlaces: Array<{
    id: string;
    name: string;
    category: string;
    description: string | null;
    guideContents: Array<{ id: string; contentType: string; title: string; content: string; sourceUrl: string | null }>;
  }>;
  routeLegs: Array<{ fromName: string; toName: string; distanceMeters: number; durationMinutes: number; isMock: boolean }>;
  costSummary: { currency: string; flightCost: number; hotelCost: number; totalCost: number };
  dataSourceNote: string;
};

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function DiscoverPage() {
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");

  const [origin, setOrigin] = useState("ICN");
  const [destination, setDestination] = useState("KIX");
  const [region, setRegion] = useState("오사카");
  const [departureDate, setDepartureDate] = useState(todayPlus(30));
  const [returnDate, setReturnDate] = useState(todayPlus(33));
  const [guests, setGuests] = useState(2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [addedPlaceIds, setAddedPlaceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/trips")
      .then((r) => r.json())
      .then((data: TripOption[]) => setTrips(data));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, region, departureDate, returnDate, guests }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `요청 실패 (${res.status})`);
      }
      setResult(await res.json());
      setAddedPlaceIds(new Set());
    } catch (err: any) {
      setError(err.message ?? "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  async function addToTrip(placeId: string) {
    if (!selectedTripId) {
      setError("먼저 추가할 여행을 선택하세요.");
      return;
    }
    await fetch("/api/trip-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: selectedTripId, placeId, visitStatus: "candidate" }),
    });
    setAddedPlaceIds((prev) => new Set(prev).add(placeId));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-neutral-900">여행지 검색 · 추천</h1>
        <p className="mt-1 text-sm text-neutral-500">
          항공권/숙소 시세와 장소 DB의 큐레이션 데이터를 함께 보고, 마음에 드는 장소를 여행에 바로 담습니다.
        </p>
      </div>

      <Card className="mb-5">
        <SectionHeader title="검색 조건" />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-xs text-neutral-500">
            출발 공항코드
            <Input value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} />
          </label>
          <label className="text-xs text-neutral-500">
            도착 공항코드
            <Input value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} />
          </label>
          <label className="text-xs text-neutral-500">
            지역명 (장소 DB 조회용)
            <Input value={region} onChange={(e) => setRegion(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-500">
            인원
            <Input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
          </label>
          <label className="text-xs text-neutral-500">
            출발일
            <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-500">
            귀국일
            <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-500 sm:col-span-2">
            추가할 여행 (선택 시 "여행에 추가" 버튼 활성화)
            <Select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
              <option value="">선택 안 함</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "검색 중..." : "검색"}
            </Button>
          </div>
        </form>
      </Card>

      {error && <p className="mb-4 text-sm text-red-600">오류: {error}</p>}

      {result && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-neutral-400">{result.dataSourceNote}</p>

          <Card>
            <SectionHeader title="예상 비용" />
            <p className="text-lg font-bold text-neutral-900">
              {result.costSummary.totalCost.toLocaleString()} {result.costSummary.currency}
            </p>
            <p className="text-sm text-neutral-500">
              항공 {result.costSummary.flightCost.toLocaleString()} + 숙박({result.nights}박){" "}
              {result.costSummary.hotelCost.toLocaleString()}
            </p>
          </Card>

          <AdSlot slot="1234567890" />

          <Card>
            <SectionHeader title="항공권 옵션" />
            <ul className="divide-y divide-neutral-100">
              {result.flights.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {f.airline} {f.isMock && <Badge tone="neutral">샌드박스</Badge>}
                  </span>
                  <span className="font-semibold">
                    {f.priceAmount.toLocaleString()} {f.priceCurrency}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader title="숙소 옵션" />
            <ul className="divide-y divide-neutral-100">
              {result.hotels.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {h.name} (★{h.rating}) {h.isMock && <Badge tone="neutral">샌드박스</Badge>}
                  </span>
                  <span className="font-semibold">
                    {h.pricePerNight.toLocaleString()} {h.currency}/박
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader title={`큐레이션 장소 (${region})`} />
            {result.curatedPlaces.length === 0 ? (
              <EmptyState>아직 이 지역 데이터가 없습니다. 자동 수집 파이프라인이 계속 쌓는 중입니다.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {result.curatedPlaces.map((p) => (
                  <li key={p.id} className="border-b border-neutral-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-neutral-800">{p.name}</span>{" "}
                        <Badge tone="accent">{p.category}</Badge>
                      </div>
                      <Button
                        variant={addedPlaceIds.has(p.id) ? "ghost" : "primary"}
                        disabled={addedPlaceIds.has(p.id)}
                        onClick={() => addToTrip(p.id)}
                      >
                        {addedPlaceIds.has(p.id) ? "추가됨" : "여행에 추가"}
                      </Button>
                    </div>
                    {p.description && <p className="mt-1 text-xs text-neutral-500">{p.description}</p>}
                    {p.guideContents
                      .filter((g) => g.contentType === "tip")
                      .map((g) => (
                        <p key={g.id} className="mt-1 text-xs text-neutral-400">
                          {g.title}: {g.content}
                        </p>
                      ))}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {result.routeLegs.length > 0 && (
            <Card>
              <SectionHeader title="동선 (구글맵 기준)" />
              <ul className="text-sm text-neutral-600">
                {result.routeLegs.map((leg, i) => (
                  <li key={i}>
                    {leg.fromName} → {leg.toName}: 약 {leg.durationMinutes}분, {(leg.distanceMeters / 1000).toFixed(1)}km{" "}
                    {leg.isMock && <Badge tone="neutral">샌드박스</Badge>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
