"use client";

import { useEffect, useMemo, useState } from "react";
import { listActiveEvents, listEventPages, listEventPhotos } from "@/lib/api";
import type { HalkgunuEvent } from "@/lib/types";
import type { ViewMode } from "@/lib/viewMode";
import { EventTabs } from "@/components/EventTabs";
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

  // İlk yüklemede aktif etkinlikleri çek
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

  // Aktif etkinlik değişince afiş ve fotoğraf varlığını hesapla (sekmeleri göstermek için)
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
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-start to-brand-end text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Halk Günü</h1>
          <p className="text-white/80 text-sm mt-1">
            Belirli günlerde, belirli mağazalarda geçerli indirimler.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {loading && <div className="text-center py-10 text-ink-500">Yükleniyor…</div>}
        {error && (
          <div className="text-center py-10 text-rose-600">Hata: {error}</div>
        )}

        {!loading && !error && (
          <>
            <EventTabs
              events={events}
              activeEventId={activeEventId}
              mode={mode}
              hasPoster={hasPoster}
              hasPhotos={hasPhotos}
              onSelectEvent={(id) => {
                setActiveEventId(id);
                setMode("liste");
              }}
              onSelectAfis={() => setMode("afis")}
              onSelectPhotos={() => setMode("fotograflar")}
            />

            {activeEvent && (
              <div className="mt-4">
                <div className="mb-4">
                  <div className="text-lg font-semibold text-ink-900">
                    {activeEvent.event_name}
                  </div>
                  <div className="text-sm text-ink-500">
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
