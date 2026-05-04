// halkgunu-web/src/components/Lightbox.tsx
// PR-5 — Foto lightbox: full-screen, swipe + ←/→, alt bantta caption, harita linki.
// Kullanım: dynamic(() => import("@/components/Lightbox"), { ssr: false })
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { posterImageUrl } from "@/lib/supabase";
import type { HalkgunuEventPhoto } from "@/lib/types";

interface Props {
  photos: HalkgunuEventPhoto[];
  startIndex: number;
  onClose: () => void;
}

function mapsHref(p: HalkgunuEventPhoto): string | null {
  if (p.latitude != null && p.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
  }
  if (p.adres) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.adres)}`;
  return null;
}

export default function Lightbox({ photos, startIndex, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex);
  const total = photos.length;
  const photo = photos[idx];

  const next = useCallback(() => setIdx(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setIdx(i => (i - 1 + total) % total), [total]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, next, prev]);

  // Swipe (pointer events — touch + mouse)
  const startX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    startX.current = null;
  };

  if (!photo) return null;
  const href = mapsHref(photo);

  return (
    <div role="dialog" aria-modal="true" aria-label="Fotoğraf görüntüleyici"
      className="fixed inset-0 z-[60] bg-black/92 flex flex-col animate-fadeIn"
      onClick={onClose}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3"
        onClick={(e) => e.stopPropagation()}>
        <span className="font-display text-sm font-bold text-white/90">
          {idx + 1} <span className="text-white/50">/ {total}</span>
        </span>
        <button onClick={onClose} aria-label="Kapat"
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur grid place-items-center
                     text-white text-xl leading-none active:bg-white/20">×</button>
      </div>

      {/* Image area */}
      <div className="flex-1 relative grid place-items-center px-2"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={(e) => e.stopPropagation()}>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={posterImageUrl(photo.image_path)}
          alt={photo.caption ?? photo.magaza_adi ?? "Halk Günü fotoğrafı"}
          className="max-w-[92%] max-h-[72vh] object-contain rounded-[16px] shadow-2xl
                     animate-fadeIn select-none"
          draggable={false}
        />

        {/* Prev/Next — only on ≥sm */}
        {total > 1 && (
          <>
            <button onClick={prev} aria-label="Önceki"
              className="hidden sm:grid absolute left-3 top-1/2 -translate-y-1/2
                         w-10 h-10 rounded-full bg-white/10 backdrop-blur place-items-center
                         text-white text-xl active:bg-white/20">‹</button>
            <button onClick={next} aria-label="Sonraki"
              className="hidden sm:grid absolute right-3 top-1/2 -translate-y-1/2
                         w-10 h-10 rounded-full bg-white/10 backdrop-blur place-items-center
                         text-white text-xl active:bg-white/20">›</button>
          </>
        )}

        {/* Dots — mobile */}
        {total > 1 && total <= 10 && (
          <div className="sm:hidden absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span key={i}
                className={"w-1.5 h-1.5 rounded-full transition " +
                  (i === idx ? "bg-white w-4" : "bg-white/40")} />
            ))}
          </div>
        )}
      </div>

      {/* Caption bottom band */}
      <div onClick={(e) => e.stopPropagation()}
        className="bg-black/60 backdrop-blur px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]
                   flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          {photo.magaza_adi && (
            <div className="font-display text-[14px] font-extrabold text-white">
              {photo.magaza_adi}
            </div>
          )}
          {photo.adres && (
            <div className="text-[11px] text-white/60 mt-0.5 line-clamp-2">{photo.adres}</div>
          )}
          {photo.caption && (
            <div className="text-[12px] text-white/85 mt-1">{photo.caption}</div>
          )}
        </div>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                       bg-success text-white text-[11px] font-bold active:bg-success/90">
            📍 Haritada göster
          </a>
        )}
      </div>
    </div>
  );
}
