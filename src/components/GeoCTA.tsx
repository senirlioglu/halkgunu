// halkgunu-web/src/components/GeoCTA.tsx
"use client";
import { useEffect, useState } from "react";

interface Props {
  onPermission?: (
    granted: boolean,
    pos?: { lat: number; lng: number } | null,
  ) => void;
}

const KEY = "hg_geo_dismissed";

export function GeoCTA({ onPermission }: Props) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") return;
    if (!("geolocation" in navigator)) return;
    setHidden(false);
  }, []);

  if (hidden) return null;

  const ask = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onPermission?.(true, { lat: p.coords.latitude, lng: p.coords.longitude });
        localStorage.setItem(KEY, "1");
        setHidden(true);
      },
      () => {
        onPermission?.(false, null);
        localStorage.setItem(KEY, "1");
        setHidden(true);
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  };

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setHidden(true);
  };

  return (
    <div className="mx-4 my-3 flex items-center gap-2.5 bg-accent-soft border-2 border-dashed
                    border-accent/50 rounded-card px-3 py-2.5 relative">
      <span className="w-8 h-8 rounded-full bg-accent text-white grid place-items-center shrink-0">📍</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-ink-900">Konumunu paylaş</div>
        <div className="text-[11px] text-ink-500 mt-0.5">En yakın indirimli mağazayı bul</div>
      </div>
      <button onClick={ask}
        className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-accent rounded-full">
        İzin ver
      </button>
      <button onClick={dismiss} aria-label="Kapat"
        className="absolute top-1 right-1.5 text-ink-500 text-sm leading-none">×</button>
    </div>
  );
}
