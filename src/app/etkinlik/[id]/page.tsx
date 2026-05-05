// halkgunu-web/src/app/etkinlik/[id]/page.tsx
// PR-5 — Kanonik etkinlik route'u. SSR + dinamik OG image.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { listActiveEvents } from "@/lib/api";
import { formatEventDate } from "@/lib/format";
import EventClient from "./EventClient";

interface Params { params: { id: string }; }

// ISR: yeni eklenen aktif event'lerin frontend'e yansıması için 60 sn'de bir
// generateStaticParams + generateMetadata yeniden koşar.
export const revalidate = 60;

// — Statik path üretimi (canlı eventler için pre-render)
export async function generateStaticParams() {
  try {
    const events = await listActiveEvents();
    return events.map(e => ({ id: e.event_id }));
  } catch {
    return [];
  }
}

// — Dinamik metadata (OG image + paylaşım)
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const events = await listActiveEvents().catch(() => []);
  const ev = events.find(e => e.event_id === params.id);
  if (!ev) return { title: "Halk Günü" };

  const title = `${ev.event_name} · ${formatEventDate(ev.event_date)} — Halk Günü`;
  const description = `Belirli mağazalarda ${formatEventDate(ev.event_date)} tarihinde geçerli indirimli ürünler.`;
  const ogUrl = `/og/${params.id}`;
  const canonical = `/etkinlik/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: "website",
      locale: "tr_TR", siteName: "Halk Günü",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title, description, images: [ogUrl],
    },
  };
}

export default async function EventPage({ params }: Params) {
  const events = await listActiveEvents().catch(() => []);
  const ev = events.find(e => e.event_id === params.id);
  if (!ev) notFound();
  return (
    <Suspense fallback={null}>
      <EventClient events={events} initialEventId={params.id} />
    </Suspense>
  );
}
