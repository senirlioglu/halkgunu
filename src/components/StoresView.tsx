"use client";

import { useEffect, useMemo, useState } from "react";
import { listEventStoreCatalog, type EventStoreCatalogStore } from "@/lib/api";

interface Props {
  eventId: string;
  userPos?: { lat: number; lng: number } | null;
}

function distanceKm(
  a: { lat: number; lng: number },
  b: { latitude: number | null; longitude: number | null },
): number {
  if (b.latitude == null || b.longitude == null) return Infinity;
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.lat);
  const dLon = toRad(b.longitude - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function directionsHref(s: EventStoreCatalogStore): string | null {
  if (s.latitude != null && s.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`;
  }
  if (s.adres) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.adres)}`;
  }
  return null;
}

export function StoresView({ eventId, userPos }: Props) {
  const [stores, setStores] = useState<EventStoreCatalogStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listEventStoreCatalog(eventId)
      .then((c) => !cancelled && setStores(c.stores))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const sorted = useMemo(() => {
    if (!userPos) return stores;
    return [...stores].sort(
      (a, b) => distanceKm(userPos, a) - distanceKm(userPos, b),
    );
  }, [stores, userPos]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-card border border-paper-border bg-paper-surface skeleton"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-center py-10 text-brand">Hata: {error}</div>;
  }
  if (stores.length === 0) {
    return (
      <div className="text-center py-10 text-ink-500">
        Bu etkinlik için mağaza listesi henüz hazır değil.
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] text-ink-500 mb-3 px-1">
        Bu Halk Günü&apos;nde indirim **{stores.length} mağazada** geçerli
        {userPos ? " · konumuna göre sıralı" : ""}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((s) => {
          const href = directionsHref(s);
          const km = userPos ? distanceKm(userPos, s) : null;
          return (
            <div
              key={s.magaza_kod}
              className="bg-paper-surface rounded-card border border-paper-border shadow-card p-3 flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-[14px] font-extrabold text-ink-900 leading-tight">
                  {s.magaza_adi ?? s.magaza_kod}
                </div>
                {km != null && Number.isFinite(km) && (
                  <span className="shrink-0 text-[10px] font-bold bg-paper-bg border border-paper-border text-ink-700 px-2 py-0.5 rounded-full">
                    {km.toFixed(1)} km
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-ink-500">
                {s.magaza_kod}
              </div>
              {s.adres ? (
                <div className="text-[12px] text-ink-700 leading-snug">
                  {s.adres}
                </div>
              ) : (
                <div className="text-[12px] text-ink-500 italic">
                  Adres bilgisi yok
                </div>
              )}
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-brand hover:text-brand-dark"
                >
                  📍 Yol tarifi →
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
