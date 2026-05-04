// halkgunu-web/src/components/EventTabs.tsx
"use client";
import type { HalkgunuEvent } from "@/lib/types";
import type { ViewMode } from "@/lib/viewMode";

const MONTHS = ["OCA","ŞUB","MAR","NİS","MAY","HAZ","TEM","AĞU","EYL","EKİ","KAS","ARA"];

interface Props {
  events: HalkgunuEvent[];
  activeEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

export function DateTabs({ events, activeEventId, onSelectEvent }: Props) {
  if (events.length === 0) return null;
  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pt-2.5">
      <div className="flex gap-2 snap-x" role="tablist" aria-label="Etkinlik tarihleri">
        {events.map((ev) => {
          const d = new Date(ev.event_date);
          const active = ev.event_id === activeEventId;
          return (
            <button
              key={ev.event_id}
              role="tab"
              aria-selected={active}
              onClick={() => onSelectEvent(ev.event_id)}
              className={
                "snap-start whitespace-nowrap rounded-[12px] px-3.5 py-2 flex items-center gap-2.5 transition " +
                (active
                  ? "text-white shadow-card bg-gradient-to-br from-brand to-accent"
                  : "bg-paper-surface text-ink-900 border border-paper-border")
              }
            >
              <span className="flex flex-col items-center leading-none">
                <span className={"text-[9px] font-bold tracking-[0.08em] " + (active ? "opacity-85" : "opacity-60")}>
                  {MONTHS[d.getMonth()]}
                </span>
                <span className="font-display text-[18px] font-extrabold mt-0.5 tracking-tightest">
                  {d.getDate()}
                </span>
              </span>
              <span className="text-[13px] font-semibold">{ev.event_name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ModeProps {
  mode: ViewMode;
  hasPoster: boolean;
  hasPhotos: boolean;
  onChange: (m: ViewMode) => void;
}

export function ModeToggle({ mode, hasPoster, hasPhotos, onChange }: ModeProps) {
  const Item = ({
    icon, label, value, color,
  }: { icon: string; label: string; value: ViewMode; color: string }) => {
    const active = mode === value;
    return (
      <button
        onClick={() => onChange(value)}
        aria-pressed={active}
        className={
          "flex-1 flex items-center justify-center gap-1.5 rounded-card px-3 py-2.5 text-[13px] font-semibold transition " +
          (active
            ? `${color} text-white border border-transparent`
            : "bg-paper-surface text-ink-700 border border-paper-border")
        }
      >
        <span className="text-sm">{icon}</span>{label}
      </button>
    );
  };
  return (
    <div className="flex gap-1.5 px-4 pt-3">
      <Item icon="☰" label="Liste" value="liste" color="bg-brand" />
      {hasPoster && <Item icon="🖼" label="Afiş" value="afis" color="bg-accent" />}
      {hasPhotos && <Item icon="📷" label="Fotoğraflar" value="fotograflar" color="bg-success" />}
    </div>
  );
}
