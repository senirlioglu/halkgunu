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
                src={posterImageUrl(p.image_path, { width: 150, quality: 65 })}
                alt={p.title || `Sayfa ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative">
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
              width: 1200,
              quality: 85,
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
                      className="absolute bottom-1.5 right-1.5
                                 w-9 h-9 rounded-full
                                 grid place-items-center
                                 text-white
                                 transition
                                 group-hover:bg-white/35 group-hover:backdrop-blur-sm group-hover:scale-110
                                 group-active:bg-brand group-active:scale-95"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
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

        {pages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => {
                setActiveIdx((i) => Math.max(0, i - 1));
                setImgReady(false);
              }}
              disabled={activeIdx === 0}
              aria-label="Önceki sayfa"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10
                         w-10 h-10 rounded-full
                         bg-ink-900/85 text-white text-xl
                         grid place-items-center
                         shadow-[0_2px_8px_rgba(0,0,0,0.25)]
                         hover:bg-ink-900 transition
                         disabled:opacity-30 disabled:pointer-events-none"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveIdx((i) => Math.min(pages.length - 1, i + 1));
                setImgReady(false);
              }}
              disabled={activeIdx >= pages.length - 1}
              aria-label="Sonraki sayfa"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10
                         w-10 h-10 rounded-full
                         bg-ink-900/85 text-white text-xl
                         grid place-items-center
                         shadow-[0_2px_8px_rgba(0,0,0,0.25)]
                         hover:bg-ink-900 transition
                         disabled:opacity-30 disabled:pointer-events-none"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
