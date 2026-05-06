"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listEventPages,
  listEventPhotos,
  listEventStoreCatalog,
} from "@/lib/api";
import { posterImageUrl } from "@/lib/supabase";
import type { HalkgunuEvent, HalkgunuPage, HalkgunuProductSummary } from "@/lib/types";
import type { ViewMode } from "@/lib/viewMode";
import { Header } from "@/components/Header";
import { DateTabs, ModeToggle } from "@/components/EventTabs";
import { ListView } from "@/components/ListView";
import { PhotosView } from "@/components/PhotosView";
import { PosterView } from "@/components/PosterView";
import { StoresView } from "@/components/StoresView";
import { StoreModal } from "@/components/StoreModal";
import { formatEventDate } from "@/lib/format";
import { track } from "@/lib/analytics";

interface Props {
  events: HalkgunuEvent[];
  initialEventId: string;
}

export default function EventClient({ events, initialEventId }: Props) {
  const router = useRouter();
  const [activeEventId, setActiveEventId] = useState<string>(initialEventId);
  // İlk açılış afiş olarak başlasın; afiş yoksa effect liste'ye düşürür.
  const [mode, setModeState] = useState<ViewMode>("afis");
  const userPickedMode = useRef(false);
  const setMode = (m: ViewMode) => {
    userPickedMode.current = true;
    setModeState(m);
    track("mode_change", { mode: m, event_id: activeEventId });
  };
  const [hasPoster, setHasPoster] = useState(false);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [hasStores, setHasStores] = useState(false);
  const [pages, setPages] = useState<HalkgunuPage[]>([]);
  // Mode bir kez aktive olunca DOM'da kalsın — geri dönünce remount olmasın.
  const [mounted, setMounted] = useState<Record<ViewMode, boolean>>({
    liste: false,
    afis: true,
    fotograflar: false,
    magazalar: false,
  });
  const [activeProduct, setActiveProduct] = useState<HalkgunuProductSummary | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setMounted((prev) => (prev[mode] ? prev : { ...prev, [mode]: true }));
  }, [mode]);

  useEffect(() => {
    if (activeEventId !== initialEventId) {
      router.replace(`/etkinlik/${activeEventId}`, { scroll: false });
    }
  }, [activeEventId, initialEventId, router]);

  // Etkinlik değişince kullanıcı tercihi sıfırlansın — yeni etkinlik için
  // varsayılan tekrar afiş.
  useEffect(() => {
    userPickedMode.current = false;
    setModeState("afis");
  }, [activeEventId]);

  useEffect(() => {
    let cancelled = false;
    listEventPages(activeEventId)
      .then((p) => {
        if (cancelled) return;
        setPages(p);
        const has = p.length > 0;
        setHasPoster(has);
        // Afiş yoksa ve kullanıcı henüz seçim yapmadıysa otomatik liste'ye düş.
        if (!has && !userPickedMode.current) {
          setModeState("liste");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPages([]);
          setHasPoster(false);
        }
      });
    listEventPhotos(activeEventId)
      .then((ph) => !cancelled && setHasPhotos(ph.length > 0))
      .catch(() => !cancelled && setHasPhotos(false));
    listEventStoreCatalog(activeEventId)
      .then((c) => !cancelled && setHasStores(c.stores.length > 0))
      .catch(() => !cancelled && setHasStores(false));
    return () => {
      cancelled = true;
    };
  }, [activeEventId]);

  // Liste/Foto modundayken ilk afiş sayfasını arka planda önyükle —
  // kullanıcı "Afiş"e geçince görsel cache'ten anında gelir.
  const firstPosterUrl = useMemo(() => {
    if (pages.length === 0) return null;
    return posterImageUrl(pages[0].image_path, { width: 1200, quality: 85 });
  }, [pages]);

  const activeEvent = useMemo(
    () => events.find((e) => e.event_id === activeEventId) ?? null,
    [events, activeEventId],
  );

  return (
    <main className="min-h-screen bg-paper-bg">
      <Header eventCount={events.length} />

      {firstPosterUrl && (
        // Browser cache'e indirir, görüntüde yer kaplamaz.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={firstPosterUrl}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          className="absolute opacity-0 pointer-events-none w-px h-px"
        />
      )}

      <div className="max-w-5xl mx-auto">
        <DateTabs
          events={events}
          activeEventId={activeEventId}
          onSelectEvent={(id) => {
            track("event_change", { event_id: id });
            setActiveEventId(id);
            setMode("liste");
          }}
        />
        <ModeToggle
          mode={mode}
          hasPoster={hasPoster}
          hasPhotos={hasPhotos}
          hasStores={hasStores}
          onChange={setMode}
        />

        {activeEvent && (
          <div className="px-4 pt-3">
            <h1 className="font-display text-lg font-extrabold text-ink-900 leading-tight">
              {activeEvent.event_name}
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {formatEventDate(activeEvent.event_date)}
            </p>
          </div>
        )}

        {/* Tüm view'lar bir kez mount olunca DOM'da kalır; sadece aktif olan
            görünür (display:none gizler). Geçişler anında. */}
        <div
          className={
            "pb-12 pt-3 px-4 max-w-3xl mx-auto " +
            (mode === "afis" && hasPoster ? "" : "hidden")
          }
        >
          {mounted.afis && activeEvent && (
            <PosterView
              eventId={activeEvent.event_id}
              onProductClick={(p) =>
                setActiveProduct({
                  urun_kod: p.urun_kod,
                  urun_ad: p.urun_ad,
                  max_normal: p.max_normal,
                  min_indirimli: p.min_indirimli,
                })
              }
            />
          )}
        </div>

        <div
          className={
            "pb-12 pt-3 px-4 " +
            (mode === "fotograflar" && hasPhotos ? "" : "hidden")
          }
        >
          {mounted.fotograflar && activeEvent && (
            <PhotosView eventId={activeEvent.event_id} />
          )}
        </div>

        <div
          className={
            "pb-12 pt-3 px-4 " +
            (mode === "magazalar" && hasStores ? "" : "hidden")
          }
        >
          {mounted.magazalar && activeEvent && (
            <StoresView
              eventId={activeEvent.event_id}
              userPos={userPos}
              onUserPos={setUserPos}
            />
          )}
        </div>

        <div
          className={
            "pb-12 pt-3 px-4 " +
            (mode === "liste" || (mode === "afis" && !hasPoster)
              ? ""
              : "hidden")
          }
        >
          {mounted.liste && activeEvent && (
            <ListView
              eventId={activeEvent.event_id}
              onProductClick={setActiveProduct}
              onGeoPermission={(_g, pos) => pos && setUserPos(pos)}
            />
          )}
        </div>
      </div>

      {activeEvent && (
        <StoreModal
          eventId={activeEvent.event_id}
          urunKod={activeProduct?.urun_kod ?? null}
          urunAd={activeProduct?.urun_ad ?? undefined}
          maxNormal={activeProduct?.max_normal}
          minIndirimli={activeProduct?.min_indirimli}
          userPos={userPos}
          onUserPos={setUserPos}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </main>
  );
}
