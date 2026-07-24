import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, dDay } from "@/lib/format";
import { Card, SectionHeader, Badge, EmptyState } from "@/components/ui";

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

export default async function HomePage() {
  const allTrips = await prisma.trip.findMany({ orderBy: { startDate: "asc" } });

  if (allTrips.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-neutral-500">아직 등록된 여행이 없습니다.</p>
        <p className="text-lg font-bold text-neutral-800">첫 여행을 만들어보세요</p>
        <Link
          href="/trips"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          여행 만들러 가기
        </Link>
      </Card>
    );
  }

  const eligibleTrips = allTrips.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const now = Date.now();
  let upcomingTrip: (typeof allTrips)[number] | null = null;
  for (const t of eligibleTrips) {
    if (!upcomingTrip) {
      upcomingTrip = t;
      continue;
    }
    const currentDiff = Math.abs(new Date(upcomingTrip.startDate).getTime() - now);
    const nextDiff = Math.abs(new Date(t.startDate).getTime() - now);
    if (nextDiff < currentDiff) upcomingTrip = t;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [todayItinerary, recentLogs, pendingReservationsCount, checklistTotal, checklistDone] =
    await Promise.all([
      prisma.itinerary.findFirst({
        where: { date: { gte: todayStart, lt: todayEnd } },
        include: { items: { orderBy: { sequence: "asc" }, include: { place: true } } },
      }),
      prisma.travelLog.findMany({
        where: { visitedAt: { not: null } },
        orderBy: { visitedAt: "desc" },
        take: 3,
        include: { place: true },
      }),
      upcomingTrip
        ? prisma.reservation.count({ where: { tripId: upcomingTrip.id, status: "pending" } })
        : Promise.resolve(0),
      upcomingTrip
        ? prisma.checklistItem.count({ where: { tripId: upcomingTrip.id } })
        : Promise.resolve(0),
      upcomingTrip
        ? prisma.checklistItem.count({ where: { tripId: upcomingTrip.id, isCompleted: true } })
        : Promise.resolve(0),
    ]);

  const checklistRate = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : null;

  const activeTrips = allTrips.filter((t) => ["planning", "confirmed", "ongoing"].includes(t.status));

  return (
    <div className="space-y-6">
      {upcomingTrip && (
        <Card>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>
              {upcomingTrip.country ?? ""} {upcomingTrip.city ?? ""}
            </span>
            <span>·</span>
            <Badge tone={STATUS_TONES[upcomingTrip.status] ?? "neutral"}>
              {STATUS_LABELS[upcomingTrip.status] ?? upcomingTrip.status}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-neutral-400">다가오는 여행</p>
              <h2 className="text-2xl font-bold text-neutral-900">{upcomingTrip.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {formatDate(upcomingTrip.startDate)} - {formatDate(upcomingTrip.endDate)}
              </p>
            </div>
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-bold text-white">
              {dDay(upcomingTrip.startDate)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={pendingReservationsCount > 0 ? "warning" : "success"}>
              예약 대기 {pendingReservationsCount}건
            </Badge>
            {checklistRate !== null && (
              <Badge tone={checklistRate >= 80 ? "success" : checklistRate >= 40 ? "warning" : "danger"}>
                준비물 {checklistRate}% 완료
              </Badge>
            )}
          </div>
        </Card>
      )}

      <Card>
        <SectionHeader title="오늘 일정" />
        {todayItinerary && todayItinerary.items.length > 0 ? (
          <ul className="space-y-2">
            {todayItinerary.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-100 px-3 py-2"
              >
                <span className="w-16 shrink-0 text-xs font-medium text-neutral-500">
                  {item.startTime ?? "-"}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-neutral-800">
                    {item.place?.name ?? item.customPlaceName ?? "이름 없는 일정"}
                  </p>
                  {item.transportType && (
                    <p className="mt-0.5 text-xs text-neutral-400">{item.transportType} 이동</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>오늘 예정된 일정이 없습니다.</EmptyState>
        )}
      </Card>

      <Card>
        <SectionHeader title="진행 예정 · 진행중 여행" />
        {activeTrips.length === 0 ? (
          <EmptyState>진행 예정이거나 진행중인 여행이 없습니다.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="rounded-lg border border-neutral-100 p-3 transition-colors hover:border-neutral-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-800">{trip.name}</p>
                  <Badge tone={STATUS_TONES[trip.status] ?? "neutral"}>
                    {STATUS_LABELS[trip.status] ?? trip.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
                <p className="mt-1 text-xs font-medium text-neutral-400">{dDay(trip.startDate)}</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="최근 기록" />
        {recentLogs.length === 0 ? (
          <EmptyState>아직 기록된 여행 기록이 없습니다.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {recentLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-neutral-800">{log.place?.name ?? "이름 없는 장소"}</p>
                  {log.visitedAt && (
                    <p className="mt-0.5 text-xs text-neutral-400">{formatDate(log.visitedAt)}</p>
                  )}
                </div>
                {log.rating !== null && <Badge tone="accent">평점 {log.rating}/5</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
