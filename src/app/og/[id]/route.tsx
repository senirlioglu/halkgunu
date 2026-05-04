// halkgunu-web/src/app/og/[id]/route.tsx
// PR-5 — Dinamik Open Graph image. /og/<event_id> → 1200×630 PNG.
// next/og kullanır (edge runtime). Bricolage Grotesque'i Google Fonts'tan çeker.

import { ImageResponse } from "next/og";
import { listActiveEvents } from "@/lib/api";
import { formatEventDate } from "@/lib/format";

export const runtime = "edge";
const size = { width: 1200, height: 630 };

interface Params { params: { id: string }; }

async function loadFont(weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@${weight}&display=swap`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then(r => r.text());
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("Font URL not found");
  return await fetch(url).then(r => r.arrayBuffer());
}

export async function GET(_req: Request, { params }: Params) {
  const events = await listActiveEvents().catch(() => []);
  const ev = events.find(e => e.event_id === params.id);

  const eventName = ev?.event_name ?? "Halk Günü";
  const dateStr = ev ? formatEventDate(ev.event_date) : "";
  const day = ev ? new Date(ev.event_date).getDate() : "";
  const dayName = ev ? new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(new Date(ev.event_date)) : "";

  const [b800, b600] = await Promise.all([loadFont(800), loadFont(600)]);

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        background: "linear-gradient(135deg, #c1272d 0%, #eab308 140%)",
        fontFamily: "'Bricolage'", color: "#fff",
      }}>
        {/* Kâğıt dokusu (CSS pattern) */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.08,
          backgroundImage:
            "repeating-linear-gradient(135deg, #fff 0 4px, transparent 4px 24px)",
        }} />

        {/* Sol blok */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          padding: "60px 56px", justifyContent: "space-between",
        }}>
          {/* Üst: logo + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="84" height="84" viewBox="0 0 40 40">
              <path d="M4 13 L20 5 L36 13 L36 17 L4 17 Z" fill="#fff" />
              <rect x="6" y="17" width="6" height="18" fill="#fff" opacity="0.85" />
              <rect x="17" y="17" width="6" height="18" fill="#fff" />
              <rect x="28" y="17" width="6" height="18" fill="#fff" opacity="0.85" />
              <rect x="6" y="33" width="28" height="3" fill="#fff" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
                halkgünü
              </span>
              <span style={{ fontSize: 22, fontWeight: 600, opacity: 0.85, marginTop: 6, letterSpacing: "0.04em" }}>
                halkgunu.net
              </span>
            </div>
          </div>

          {/* Alt: tarih + isim */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ev && (
              <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.9, marginBottom: 8 }}>
                {dayName.toUpperCase()}
              </span>
            )}
            <span style={{
              fontSize: ev ? 116 : 84, fontWeight: 800,
              letterSpacing: "-0.04em", lineHeight: 0.95,
            }}>
              {ev ? `${day} ${dateStr.split(" ").slice(1, 2).join(" ")}` : "Halk Günü"}
            </span>
            <span style={{ fontSize: 32, fontWeight: 600, marginTop: 16, opacity: 0.95, maxWidth: 600 }}>
              {eventName}
            </span>
          </div>
        </div>

        {/* Sağ: dekoratif fiyat etiketleri */}
        <div style={{
          width: 380, position: "relative", padding: 40,
          display: "flex", flexDirection: "column", gap: 22, justifyContent: "center",
        }}>
          {[
            { pct: 32, name: "Süt 1L", rotate: -4 },
            { pct: 25, name: "Domates kg", rotate: 3 },
            { pct: 40, name: "Yumurta 30'lu", rotate: -2 },
          ].map((t, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 16, padding: "16px 22px",
              transform: `rotate(${t.rotate}deg)`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{
                fontSize: 36, fontWeight: 800, color: "#c1272d", letterSpacing: "-0.03em",
              }}>−%{t.pct}</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: "#1c1410" }}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: b800, weight: 800, style: "normal" },
        { name: "Bricolage", data: b600, weight: 600, style: "normal" },
      ],
    },
  );
}
