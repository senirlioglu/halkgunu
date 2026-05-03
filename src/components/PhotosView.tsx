"use client";

import { useEffect, useState } from "react";
import { listEventPhotos } from "@/lib/api";
import { posterImageUrl } from "@/lib/supabase";
import type { HalkgunuEventPhoto } from "@/lib/types";

interface Props {
  eventId: string;
}

function mapsHref(photo: HalkgunuEventPhoto): string | null {
  if (photo.latitude != null && photo.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${photo.latitude},${photo.longitude}`;
  }
  if (photo.adres) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(photo.adres)}`;
  }
  return null;
}

export function PhotosView({ eventId }: Props) {
  const [photos, setPhotos] = useState<HalkgunuEventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return <div className="text-center py-10 text-ink-500">Yükleniyor…</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-rose-600">Hata: {error}</div>;
  }
  if (photos.length === 0) {
    return (
      <div className="text-center py-10 text-ink-500">
        Bu etkinlik için henüz fotoğraf yüklenmemiş.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {photos.map((p) => {
        const href = mapsHref(p);
        return (
          <figure
            key={p.id}
            className="bg-white rounded-card overflow-hidden border border-slate-200 shadow-sm flex flex-col"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterImageUrl(p.image_path)}
              alt={p.caption ?? p.magaza_adi ?? "Halk Günü"}
              className="w-full aspect-[4/3] object-cover bg-slate-100"
              loading="lazy"
            />
            <figcaption className="p-3 flex flex-col gap-1">
              {p.magaza_adi && (
                <div className="text-sm font-semibold text-ink-900">
                  {p.magaza_adi}
                </div>
              )}
              {p.adres && (
                <div className="text-xs text-ink-500">{p.adres}</div>
              )}
              {p.caption && (
                <div className="text-sm text-ink-700 mt-1">{p.caption}</div>
              )}
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-700 hover:text-emerald-800 mt-1 inline-block"
                >
                  Haritada göster →
                </a>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
