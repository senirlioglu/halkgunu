"use client";

import type { HalkgunuEvent } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import type { ViewMode } from "@/lib/viewMode";

interface Props {
  events: HalkgunuEvent[];
  activeEventId: string | null;
  mode: ViewMode;
  hasPoster: boolean;
  hasPhotos: boolean;
  onSelectEvent: (eventId: string) => void;
  onSelectAfis: () => void;
  onSelectPhotos: () => void;
}

export function EventTabs({
  events,
  activeEventId,
  mode,
  hasPoster,
  hasPhotos,
  onSelectEvent,
  onSelectAfis,
  onSelectPhotos,
}: Props) {
  if (events.length === 0) {
    return (
      <div className="text-center text-ink-500 py-6">
        Şu an aktif bir Halk Günü etkinliği yok.
      </div>
    );
  }
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
      {events.map((ev) => {
        const isActive = ev.event_id === activeEventId && mode === "liste";
        return (
          <button
            key={ev.event_id}
            onClick={() => onSelectEvent(ev.event_id)}
            className={
              "snap-start whitespace-nowrap px-4 py-2 rounded-card text-sm font-medium transition " +
              (isActive
                ? "bg-gradient-to-r from-brand-start to-brand-end text-white shadow-brand"
                : "bg-white text-ink-700 hover:bg-slate-100 border border-slate-200")
            }
          >
            <div className="text-xs opacity-80">{formatShortDate(ev.event_date)}</div>
            <div>{ev.event_name}</div>
          </button>
        );
      })}
      {hasPoster && (
        <button
          onClick={onSelectAfis}
          className={
            "snap-start whitespace-nowrap px-4 py-2 rounded-card text-sm font-medium transition flex flex-col justify-center " +
            (mode === "afis"
              ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-[0_4px_15px_rgba(245,158,11,0.35)]"
              : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-300")
          }
        >
          <div className="text-xs opacity-80">Görsel</div>
          <div>Afiş</div>
        </button>
      )}
      {hasPhotos && (
        <button
          onClick={onSelectPhotos}
          className={
            "snap-start whitespace-nowrap px-4 py-2 rounded-card text-sm font-medium transition flex flex-col justify-center " +
            (mode === "fotograflar"
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.35)]"
              : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300")
          }
        >
          <div className="text-xs opacity-80">Bizden</div>
          <div>Fotoğraflar</div>
        </button>
      )}
    </div>
  );
}
