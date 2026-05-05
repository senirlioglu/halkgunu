// halkgunu-web/src/app/page.tsx
// PR-5 — Anasayfa. Aktif etkinlik(ler)den ilkine redirect. Eski ?event=... query
// param'ı destekler (geriye uyumluluk).

import { redirect } from "next/navigation";
import { listActiveEvents } from "@/lib/api";

// Anasayfa redirect mantığı — DB'deki son event listesine bakmalı, build-cache değil.
export const dynamic = "force-dynamic";

interface Props { searchParams: { event?: string }; }

export default async function HomePage({ searchParams }: Props) {
  const events = await listActiveEvents().catch(() => []);

  // Eski link uyumluluğu: /?event=xxx → /etkinlik/xxx
  if (searchParams.event) {
    const exists = events.some(e => e.event_id === searchParams.event);
    if (exists) redirect(`/etkinlik/${searchParams.event}`);
  }

  if (events.length === 0) {
    return (
      <main className="min-h-screen bg-paper-bg grid place-items-center px-6">
        <div className="text-center max-w-sm">
          {/* Logo silüeti — gri */}
          <div className="w-16 h-16 mx-auto mb-4 opacity-30">
            <svg viewBox="0 0 40 40" fill="#1c1410">
              <path d="M4 13 L20 5 L36 13 L36 17 L4 17 Z" />
              <rect x="6" y="17" width="6" height="18" />
              <rect x="17" y="17" width="6" height="18" />
              <rect x="28" y="17" width="6" height="18" />
              <rect x="6" y="33" width="28" height="3" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-extrabold text-ink-900">
            Şu an aktif Halk Günü yok
          </h1>
          <p className="text-sm text-ink-500 mt-2">
            Sosyal medyamızdan duyurularımızı takip edebilirsin.
          </p>
        </div>
      </main>
    );
  }

  // İlk aktif etkinliğe yönlendir
  redirect(`/etkinlik/${events[0].event_id}`);
}
