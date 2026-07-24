export function formatDate(d: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", ...opts }).format(date);
}

export function formatDateISO(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function formatMoney(amount: number | null | undefined, currency = "KRW") {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function dDay(start: string | Date) {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  const diff = Math.round((s.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "D-Day";
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  landmark: "관광지",
  restaurant: "음식점",
  cafe: "카페",
  shopping: "쇼핑",
  hotel: "숙소",
  airport: "공항",
  station: "역·터미널",
  convenience: "편의시설",
  hospital: "병원·약국",
  other: "기타",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  transport: "교통",
  lodging: "숙박",
  food: "식비",
  activity: "관광",
  shopping: "쇼핑",
  telecom: "통신",
  insurance: "보험",
  other: "기타",
};

export const CHECKLIST_CATEGORY_LABELS: Record<string, string> = {
  document: "서류",
  clothing: "의류",
  electronics: "전자기기",
  medicine: "의약품",
  toiletries: "세면도구",
  reservation: "예약 확인",
  currency: "환전",
  telecom: "통신",
  local: "현지 준비",
};

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  flight: "항공권",
  accommodation: "숙소",
  train: "철도",
  bus: "버스",
  rentalcar: "렌터카",
  activity: "관광시설",
  restaurant: "식당",
  show: "공연",
  insurance: "여행자보험",
};

export function mapUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
