"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listEventMappings, listEventPages } from "@/lib/api";
import { posterImageUrl } from "@/lib/supabase";
import type { HalkgunuMapping, HalkgunuPage } from "@/lib/types";
import type { ClickedProduct } from "./StoreModal";

interface Props {
  eventId: string;
  onProductClick: (product: ClickedProduct) => void;
}

export function PosterView({ eventId, onProductClick }: Props) {
  const [pages, setPages] = useState<HalkgunuPage[]>([]);
  const [mappings, setMappings] = useState<HalkgunuMapping[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setImgReady(false);
    Promise.all([listEventPages(eventId), listEventMappings(eventId)])
      .then(([p, m]) => {
        if (cancelled) return;
        setPages(p);
        setMappings(m);
        setActiveIdx(0);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const activePage = pages[activeIdx];

  const pageMappings = useMemo(() => {
    if (!activePage) return [];
    return mappings.filter(
      (m) =>
        m.flyer_filename === activePage.flyer_filename &&
        m.page_no === activePage.page_no,
    );
  }, [mappings, activePage]);

  if (loading) {
    return (
      <div className="aspect-[3/4] rounded-card border border-paper-border bg-paper-surface skeleton" />
    );
  }
  if (error) {
    return <div className="text-center py-10 text-brand">Hata: {error}</div>;
  }
  if (pages.length === 0) {
    return (
      <div className="text-center py-10 text-ink-500">
        Bu etkinlik için afiş henüz yüklenmemiş.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] text-ink-500 -mb-2 px-1">
        Bir ürünün üzerindeki <span aria-hidden>🔍</span> simgesine dokunarak
        satıldığı mağazaları gör.
      </p>

      {pages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveIdx(i);
                setImgReady(false);
              }}
              aria-label={p.title || `Sayfa ${i + 1}`}
              className={
                "shrink-0 w-20 h-24 rounded-md overflow-hidden border-2 transition " +
                (i === activeIdx
                  ? "border-brand shadow-card"
                  : "border-paper-border hover:border-ink-300")
              }
              title={p.title || `Sayfa ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterImageUrl(p.image_path, { width: 200, quality: 70 })}
                alt={p.title || `Sayfa ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}

      <div
        ref={wrapRef}
        className="relative w-full bg-paper-surface rounded-card overflow-hidden shadow-card border border-paper-border"
      >
        {!imgReady && (
          <div className="aspect-[3/4] w-full skeleton rounded-card" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterImageUrl(activePage.image_path, {
            width: 1800,
            quality: 92,
          })}
          alt={activePage.title || ""}
          className={
            "w-full h-auto block transition-opacity duration-200 " +
            (imgReady ? "opacity-100" : "opacity-0 absolute")
          }
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImgReady(true)}
        />

        {imgReady &&
          pageMappings.map((m) => {
            const left = `${m.x0 * 100}%`;
            const top = `${m.y0 * 100}%`;
            const width = `${(m.x1 - m.x0) * 100}%`;
            const height = `${(m.y1 - m.y0) * 100}%`;
            const disabled = !m.urun_kodu;

            const onActivate = () => {
              if (!m.urun_kodu) return;
              onProductClick({
                urun_kod: m.urun_kodu,
                urun_ad: m.urun_aciklamasi,
                max_normal: null,
                min_indirimli: null,
              });
            };

            return (
              <button
                key={m.mapping_id}
                type="button"
                onClick={onActivate}
                disabled={disabled}
                aria-label={
                  m.urun_kodu
                    ? `${m.urun_kodu}${m.urun_aciklamasi ? " — " + m.urun_aciklamasi : ""}`
                    : "Boş alan"
                }
                title={
                  m.urun_kodu
                    ? `${m.urun_kodu}${m.urun_aciklamasi ? " — " + m.urun_aciklamasi : ""}`
                    : ""
                }
                className={
                  "absolute group rounded-sm transition " +
                  (disabled
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-brand/5 active:bg-brand/10")
                }
                style={{ left, top, width, height }}
              >
                {!disabled && (
                  <span
                    aria-hidden
                    className="absolute bottom-1 right-1 w-7 h-7 rounded-full
                               bg-white/75 text-ink-700 grid place-items-center
                               shadow-[0_1px_4px_rgba(0,0,0,0.25)]
                               transition opacity-90
                               group-hover:bg-white group-hover:scale-110
                               group-active:bg-brand group-active:text-white
                               group-active:scale-95"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-[60%] h-[60%]"
                    >
                      <circle cx="10" cy="10" r="6" />
                      <line x1="14.5" y1="14.5" x2="20" y2="20" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
