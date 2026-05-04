"use client";

import { useEffect, useMemo, useState } from "react";
import { listActiveEvents, listEventPages, listEventPhotos } from "@/lib/api";
import type { HalkgunuEvent } from "@/lib/types";
import type { ViewMode } from "@/lib/viewMode";
import { Header } from "@/components/Header";
import { DateTabs, ModeToggle } from "@/components/EventTabs";
import { ListView } from "@/components/ListView";
import { PhotosView } from "@/components/PhotosView";
import { PosterView } from "@/components/PosterView";
import { StoreModal } from "@/components/StoreModal";
import { formatEventDate } from "@/lib/format";

export default function Page() {
  const [events, setEvents] = useState<HalkgunuEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("liste");
  const [hasPoster, setHasPoster] = useState(false);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listActiveEvents()
      .then((rows) => {
        if (cancelled) return;
        setEvents(rows);
        if (rows.length > 0) setActiveEventId(rows[0].event_id);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeEventId) {
      setHasPoster(false);
      setHasPhotos(false);
      return;
    }
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
        {loading && (
          <div className="text-center py-10 text-ink-500">Yükleniyor…</div>
        )}
        {error && (
          <div className="text-center py-10 text-brand">Hata: {error}</div>
        )}

        {!loading && !error && (
          <>
            <DateTabs
              events={events}
              activeEventId={activeEventId}
              onSelectEvent={(id) => {
                setActiveEventId(id);
                setMode("liste");
              }}
            />

            {activeEvent && (
              <ModeToggle
                mode={mode}
                hasPoster={hasPoster}
                hasPhotos={hasPhotos}
                onChange={setMode}
              />
            )}

            {activeEvent && (
              <div className="mt-4 px-4">
                <div className="mb-4">
                  <div className="font-display text-xl font-extrabold text-ink-900 tracking-tightest">
                    {activeEvent.event_name}
                  </div>
                  <div className="text-sm text-ink-500 mt-0.5">
                    {formatEventDate(activeEvent.event_date)}
                  </div>
                </div>

                {mode === "afis" && hasPoster ? (
                  <PosterView
                    eventId={activeEvent.event_id}
                    onProductClick={setActiveProduct}
                  />
                ) : mode === "fotograflar" && hasPhotos ? (
                  <PhotosView eventId={activeEvent.event_id} />
                ) : (
                  <ListView
                    eventId={activeEvent.event_id}
                    onProductClick={setActiveProduct}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {activeEvent && (
        <StoreModal
          eventId={activeEvent.event_id}
          urunKod={activeProduct}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </main>
  );
}
