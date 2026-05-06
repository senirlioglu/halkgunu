"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { listEventPhotos } from "@/lib/api";
import { posterImageUrl } from "@/lib/supabase";
import type { HalkgunuEventPhoto } from "@/lib/types";
import { track } from "@/lib/analytics";

const Lightbox = dynamic(
  () => import("@/components/Lightbox").then((m) => m.default),
  { ssr: false },
);

interface Props {
  eventId: string;
}

export function PhotosView({ eventId }: Props) {
  const [photos, setPhotos] = useState<HalkgunuEventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listEventPhotos(eventId)
      .then((rows) => !cancelled && setPhotos(rows))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-card border border-paper-border bg-paper-surface skeleton"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-center py-10 text-brand">Hata: {error}</div>;
  }
  if (photos.length === 0) {
    return (
      <div className="text-center py-10 text-ink-500">
        Bu etkinlik için henüz fotoğraf yüklenmemiş.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              track("lightbox_open", { event_id: eventId, photo_id: p.id });
              setLightboxIdx(i);
            }}
            className="bg-paper-surface rounded-card overflow-hidden border border-paper-border
                       shadow-card flex flex-col text-left active:translate-y-px transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterImageUrl(p.image_path)}
              alt={p.caption ?? p.magaza_adi ?? "Halk Günü"}
              className="w-full aspect-[4/3] object-cover bg-paper-bg"
              loading="lazy"
            />
            <div className="p-2.5 flex flex-col gap-0.5">
              {p.magaza_adi && (
                <div className="font-display text-[12px] font-bold text-ink-900 leading-tight">
                  {p.magaza_adi}
                </div>
              )}
              {p.adres && (
                <div className="text-[10px] text-ink-500 line-clamp-1">
                  {p.adres}
                </div>
              )}
              {p.caption && (
                <div className="text-[11px] text-ink-700 mt-0.5 line-clamp-2">
                  {p.caption}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      {lightboxIdx != null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}
