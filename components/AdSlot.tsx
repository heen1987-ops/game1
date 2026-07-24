"use client";

import { useEffect, useRef } from "react";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

// AdSense 승인/게시자 ID 발급 전까지는 자리표시자만 보여준다.
// 발급되면 .env의 NEXT_PUBLIC_ADSENSE_CLIENT_ID만 채우면 실제 광고가 뜬다.
export function AdSlot({ slot, format = "auto" }: { slot: string; format?: string }) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return;
    try {
      // @ts-expect-error adsbygoogle는 전역 스크립트가 주입하는 배열
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 스크립트 로드 전 호출되는 경우는 무시
    }
  }, []);

  if (!ADSENSE_CLIENT_ID) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
        광고 영역 (AdSense 승인 전 — NEXT_PUBLIC_ADSENSE_CLIENT_ID 설정 시 실제 광고 표시)
      </div>
    );
  }

  return (
    <ins
      ref={insRef}
      className="adsbygoogle block"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
