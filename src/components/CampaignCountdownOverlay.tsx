"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { WhatsAppIcon } from "./WhatsAppFollow";
import { isCountdownDay, nextSaturdayMidnight } from "@/lib/campaignSchedule";

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-paper-bg border border-paper-border rounded-card
                      w-14 h-14 sm:w-16 sm:h-16 grid place-items-center shadow-sm">
        <span className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 tabular-nums">
          {value}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-wide text-ink-500 mt-1.5">
        {label}
      </span>
    </div>
  );
}

export function CampaignCountdownOverlay() {
  const [now, setNow] = useState<Date | null>(null);
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL;

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now || !isCountdownDay(now)) return null;

  const ms = nextSaturdayMidnight(now).getTime() - now.getTime();
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return (
    <div className="absolute inset-0 z-30 backdrop-blur-md bg-paper-bg/60">
      <div className="sticky top-4 mx-auto max-w-md w-full px-4 pt-6">
        <div className="bg-paper-surface border border-paper-border rounded-card
                        shadow-xl p-5 text-center">
          <div className="text-[11px] font-bold text-brand uppercase tracking-wide">
            Halk Günü Büyük İndirimleri
          </div>
          <div className="text-xs text-ink-700 mt-1">için kalan süre</div>

          <div className="mt-4 flex items-start justify-center gap-2 sm:gap-3">
            <Cell value={pad(days)} label="Gün" />
            <span className="font-display text-2xl sm:text-3xl font-extrabold
                             text-ink-500 self-center -mt-3">:</span>
            <Cell value={pad(hours)} label="Saat" />
            <span className="font-display text-2xl sm:text-3xl font-extrabold
                             text-ink-500 self-center -mt-3">:</span>
            <Cell value={pad(minutes)} label="Dakika" />
            <span className="font-display text-2xl sm:text-3xl font-extrabold
                             text-ink-500 self-center -mt-3">:</span>
            <Cell value={pad(seconds)} label="Saniye" />
          </div>

          <div className="text-[12px] font-bold text-ink-900 mt-4">
            Kampanya her Cumartesi & Pazar
          </div>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "countdown" })}
              className="mt-4 inline-flex items-center gap-2 bg-[#25D366]
                         text-white font-semibold text-sm px-4 py-2.5 rounded-full
                         shadow-[0_2px_6px_rgba(37,211,102,0.35)]
                         active:scale-95 transition"
            >
              <WhatsAppIcon className="w-4 h-4" />
              WhatsApp kanalımızı takip et
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
