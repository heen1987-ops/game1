import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  title: "Trip Platform",
  description: "개인 맞춤형 여행 운영 플랫폼",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#171717",
};

const NAV = [
  { href: "/", label: "홈" },
  { href: "/trips", label: "여행" },
  { href: "/places", label: "장소 DB" },
  { href: "/discover", label: "여행지 검색" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <RegisterSW />
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-sm font-bold tracking-tight">
              ✈️ Trip Platform
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-600">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-neutral-950">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
