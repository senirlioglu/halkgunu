// halkgunu-web/src/components/StoreModal.tsx (yeni — bottom-sheet + segmented sıralama)
"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductStores } from "@/lib/api";
import { productImageUrl } from "@/lib/supabase";
import { formatPrice, discountPercent } from "@/lib/format";
import type { HalkgunuProductStore } from "@/lib/types";
import { track } from "@/lib/analytics";

export interface ClickedProduct {
  urun_kod: string;
  urun_ad: string | null;
  max_normal: number | null;
  min_indirimli: number | null;
}

interface Props {
  eventId: string;
  urunKod: string | null;
  urunAd?: string;
  maxNormal?: number | null;
  minIndirimli?: number | null;
  userPos?: { lat: number; lng: number } | null;
  onUserPos?: (pos: { lat: number; lng: number }) => void;
  onClose: () => void;
}

type SortKey = "yakinlik" | "fiyat" | "stok";

function distanceKm(a: {lat:number;lng:number}, b: {latitude:number|null;longitude:number|null}) {
  if (b.latitude == null || b.longitude == null) return Infinity;
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.lat);
  const dLon = toRad(b.longitude - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.latitude);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function StoreModal({
  eventId, urunKod, urunAd, maxNormal, minIndirimli, userPos, onUserPos, onClose,
}: Props) {
  const [stores, setStores] = useState<HalkgunuProductStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>(userPos ? "yakinlik" : "fiyat");
  const [imgError, setImgError] = useState(false);
  const [geoPending, setGeoPending] = useState(false);

  const requestGeo = () => {
    if (!("geolocation" in navigator)) return;
    setGeoPending(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoPending(false);
        onUserPos?.({ lat: p.coords.latitude, lng: p.coords.longitude });
        track("geo_request", { source: "modal", granted: true });
      },
      () => {
        setGeoPending(false);
        setSort("fiyat"); // izin verilmedi → fiyata dön
        track("geo_request", { source: "modal", granted: false });
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  useEffect(() => {
    if (!urunKod) return;
    let cancelled = false;
    setLoading(true); setError(null); setImgError(false);
    getProductStores(eventId, urunKod)
      .then((rows) => !cancelled && setStores(rows))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [eventId, urunKod]);

  const sorted = useMemo(() => {
    const arr = [...stores];
    if (sort === "yakinlik" && userPos) {
      arr.sort((a, b) => distanceKm(userPos, a) - distanceKm(userPos, b));
    } else if (sort === "fiyat") {
      arr.sort((a, b) => (a.indirimli_fiyat ?? Infinity) - (b.indirimli_fiyat ?? Infinity));
    } else if (sort === "stok") {
      arr.sort((a, b) => b.stok_adet - a.stok_adet);
    }
    return arr;
  }, [stores, sort, userPos]);

  // ESC handler + scroll lock
  useEffect(() => {
    if (!urunKod) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [urunKod, onClose]);

  if (!urunKod) return null;
  const colors = ["#15803d", "#c1272d", "#eab308", "#a01e23"];
  const pct = discountPercent(maxNormal, minIndirimli);

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Mağaza listesi"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center
                 animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper-surface w-full max-w-2xl max-h-[85vh] flex flex-col
                   rounded-t-sheet shadow-sheet animate-slideUp"
      >
        <div className="pt-2 pb-1"><div className="sheet-handle" /></div>

        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-paper-border">
          <div className="w-16 h-16 shrink-0 rounded-card overflow-hidden bg-kraft-stripe grid place-items-center">
            {imgError ? (
              <span className="text-2xl opacity-70">📦</span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={productImageUrl(urunKod)} alt={urunKod}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain p-1" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono text-ink-500">{urunKod}</div>
            <div className="font-display text-sm font-bold text-ink-900 leading-snug">
              {urunAd ?? "İndirimli Mağazalar"}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
              {minIndirimli != null && (
                <span className="font-display text-base font-extrabold text-brand">
                  {formatPrice(minIndirimli)}
                </span>
              )}
              {maxNormal != null && (
                <span className="text-[11px] text-ink-500 line-through">{formatPrice(maxNormal)}</span>
              )}
              {pct != null && (
                <span className="text-[10px] font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded">
                  %{pct} indirim
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Kapat"
            className="text-ink-500 text-2xl leading-none px-1">×</button>
        </div>

        {/* Sort segmented */}
        <div className="px-4 pt-2.5 pb-1">
          <div className="flex bg-paper-bg rounded-full p-0.5 gap-0.5">
            {([
              ["yakinlik", "Yakınlık"],
              ["fiyat", "Fiyat"],
              ["stok", "Stok"],
            ] as [SortKey, string][]).map(([k, l]) => (
              <button
                key={k}
                onClick={() => {
                  setSort(k);
                  // Yakınlık seçildi ve henüz konum yok → izin iste
                  if (k === "yakinlik" && !userPos && !geoPending) {
                    requestGeo();
                  }
                }}
                className={
                  "flex-1 px-2 py-1.5 rounded-full text-xs font-semibold transition " +
                  (sort === k
                    ? "bg-paper-surface text-ink-900 shadow-sm"
                    : "text-ink-500")
                }
              >
                {l}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-ink-500 mt-1.5">
            {sort === "yakinlik" && geoPending && <>Konum alınıyor…</>}
            {!loading && stores.length > 0 && !geoPending && (
              <>
                {stores.length} mağazada mevcut
                {sort === "yakinlik" && userPos
                  ? " · konumuna göre sıralı"
                  : sort === "yakinlik" && !userPos
                    ? " · konum yok, fiyata göre sıralı"
                    : sort === "fiyat"
                      ? " · fiyata göre sıralı"
                      : ""}
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-1.5">
          {loading && <SkeletonStores />}
          {error && <div className="text-center text-brand py-6">Hata: {error}</div>}
          {!loading && !error && stores.length === 0 && (
            <div className="text-center text-ink-500 py-6">Bu ürün için indirimli mağaza bulunamadı.</div>
          )}
          {!loading && !error && sorted.map((s, i) => {
            const c = colors[i % colors.length];
            const km = userPos ? distanceKm(userPos, s) : null;
            const mapsHref = s.latitude != null && s.longitude != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`
              : s.adres
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.adres)}`
                : null;
            return (
              <div key={s.magaza_kod} className="store-card"
                style={{ borderLeftColor: c, background: `linear-gradient(135deg, ${c}1a 0%, ${c}0a 100%)` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-ink-900">{s.magaza_adi ?? s.magaza_kod}</span>
                    {km != null && Number.isFinite(km) && (
                      <span className="text-[10px] font-bold bg-paper-surface px-1.5 py-0.5
                                       rounded-full border" style={{ color: c, borderColor: `${c}55` }}>
                        {km.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  {s.adres && <div className="text-[10px] text-ink-500 mt-0.5 line-clamp-2">{s.adres}</div>}
                  <div className="text-[10px] text-ink-500 mt-1 font-mono">
                    {s.magaza_kod}
                  </div>
                  {mapsHref && (
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer"
                       onClick={() => track("directions_click", {
                         source: "modal",
                         magaza_kod: s.magaza_kod,
                         event_id: eventId,
                         urun_kod: urunKod ?? undefined,
                       })}
                       className="inline-block mt-1.5 text-[11px] font-semibold text-brand">
                      📍 Yol tarifi →
                    </a>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-[15px] font-extrabold text-brand">
                    {formatPrice(s.indirimli_fiyat)}
                  </div>
                  {s.normal_fiyat != null && s.indirimli_fiyat != null
                   && s.normal_fiyat > s.indirimli_fiyat && (
                    <div className="text-[10px] text-ink-500 line-through">{formatPrice(s.normal_fiyat)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkeletonStores() {
  return (
    <div className="space-y-2 py-2">
      {[0,1,2].map(i => (
        <div key={i} className="rounded-card p-3 border-l-4 border-ink-300/40 bg-paper-bg">
          <div className="skeleton h-3 w-2/3 mb-2" />
          <div className="skeleton h-2.5 w-1/2 mb-1.5" />
          <div className="skeleton h-2.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}
