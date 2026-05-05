"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listEventPages, listEventPhotos } from "@/lib/api";
import type { HalkgunuEvent, HalkgunuProductSummary } from "@/lib/types";
import type { ViewMode } from "@/lib/viewMode";
import { Header } from "@/components/Header";
import { DateTabs, ModeToggle } from "@/components/EventTabs";
import { ListView } from "@/components/ListView";
import { PhotosView } from "@/components/PhotosView";
import { PosterView } from "@/components/PosterView";
import { StoreModal } from "@/components/StoreModal";
import { formatEventDate } from "@/lib/format";

interface Props {
  events: HalkgunuEvent[];
  initialEventId: string;
}

export default function EventClient({ events, initialEventId }: Props) {
  const router = useRouter();
  const [activeEventId, setActiveEventId] = useState<string>(initialEventId);
  const [mode, setMode] = useState<ViewMode>("liste");
  const [hasPoster, setHasPoster] = useState(false);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [activeProduct, setActiveProduct] = useState<HalkgunuProductSummary | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (activeEventId !== initialEventId) {
      router.replace(`/etkinlik/${activeEventId}`, { scroll: false });
    }
  }, [activeEventId, initialEventId, router]);

  useEffect(() => {
    let cancelled = false;
    listEventPages(activeEventId)
      .then((p) => !cancelled && setHasPoster(p.length > 0))
      .catch(() => !cancelled && setHasPoster(false));
    listEventPhotos(activeEventId)
      .then((ph) => !cancelled && setHasPhotos(ph.length > 0))
      .catch(() => !cancelled && setHasPhotos(false));
    return () => {
      cancelled = true;
    };
  }, [activeEventId]);

  const activeEvent = useMemo(
    () => events.find((e) => e.event_id === activeEventId) ?? null,
    [events, activeEventId],
  );

  return (
    <main className="min-h-screen bg-paper-bg">
      <Header eventCount={events.length} />

      <div className="max-w-5xl mx-auto">
        <DateTabs
          events={events}
          activeEventId={activeEventId}
          onSelectEvent={(id) => {
            setActiveEventId(id);
            setMode("liste");
          }}
        />
        <ModeToggle
          mode={mode}
          hasPoster={hasPoster}
          hasPhotos={hasPhotos}
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

        {/* Poster modu masaüstünde rahatsız edici şekilde gerilmesin diye
            kendi dar konteyneri var; liste/foto grid'i full-w kullanır. */}
        <div
          className={
            "pb-12 pt-3 " +
            (mode === "afis" && hasPoster
              ? "px-4 max-w-2xl mx-auto"
              : "px-4")
          }
        >
          {mode === "afis" && hasPoster && activeEvent ? (
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
          ) : mode === "fotograflar" && hasPhotos && activeEvent ? (
            <PhotosView eventId={activeEvent.event_id} />
          ) : activeEvent ? (
            <ListView
              eventId={activeEvent.event_id}
              onProductClick={setActiveProduct}
              onGeoPermission={(_g, pos) => pos && setUserPos(pos)}
            />
          ) : null}
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
          onClose={() => setActiveProduct(null)}
        />
      )}
    </main>
  );
}
