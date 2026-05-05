// halkgunu-web/src/components/EventTabs.tsx
"use client";
import type { HalkgunuEvent } from "@/lib/types";
import type { ViewMode } from "@/lib/viewMode";

interface Props {
  events: HalkgunuEvent[];
  activeEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

export function DateTabs({ events, activeEventId, onSelectEvent }: Props) {
  if (events.length === 0) return null;
  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pt-3">
      <div
        className="flex gap-2 snap-x"
        role="tablist"
        aria-label="Etkinlik tarihleri"
      >
        {events.map((ev) => {
          const active = ev.event_id === activeEventId;
          return (
            <button
              key={ev.event_id}
              role="tab"
              aria-selected={active}
              onClick={() => onSelectEvent(ev.event_id)}
              className={
                "snap-start whitespace-nowrap rounded-full px-5 py-2.5 text-[14px] font-semibold transition " +
                (active
                  ? "bg-brand text-white shadow-[0_4px_15px_rgba(193,39,45,0.25)]"
                  : "bg-paper-surface text-ink-700 border border-paper-border hover:border-ink-300")
              }
            >
              {ev.event_name}
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
