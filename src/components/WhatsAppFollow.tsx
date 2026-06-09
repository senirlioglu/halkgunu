"use client";

import { track } from "@/lib/analytics";

/**
 * WhatsApp kanal/topluluk takip butonu.
 *
 * Vercel env'de NEXT_PUBLIC_WHATSAPP_URL set edilince görünür hale gelir
 * (örn. https://whatsapp.com/channel/0029Vxxxxxxx). Set edilmezse render
 * edilmez — gizli kalır, dashboard'dan tek değişkenle açılıp kapanır.
 *
 * `compact=true` header'ın yanında küçük yeşil pill; aksi halde geniş kart.
 */
interface Props {
  compact?: boolean;
}

export function WhatsAppFollow({ compact = false }: Props) {
  const url = process.env.NEXT_PUBLIC_WHATSAPP_URL;
  if (!url) return null;

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_click", { source: "header" })}
        aria-label="WhatsApp'tan takip et"
        title="WhatsApp'tan takip et"
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full
                   bg-[#25D366] text-white text-[12px] font-bold
                   shadow-[0_2px_6px_rgba(37,211,102,0.35)]
                   active:scale-95 transition"
      >
        <WhatsAppIcon className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp&apos;tan takip et</span>
        <span className="sm:hidden">Takip et</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { source: compact ? "header" : "banner" })}
      className="mx-4 my-4 flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/30
                 rounded-card px-3.5 py-3 hover:bg-[#25D366]/15 transition"
    >
      <span className="w-10 h-10 rounded-full bg-[#25D366] grid place-items-center shrink-0 shadow-[0_2px_6px_rgba(37,211,102,0.35)]">
        <WhatsAppIcon className="w-5 h-5 text-white" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-bold text-ink-900">
          Yeni Halk Günü&apos;nden ilk sen haberdar ol
        </span>
        <span className="block text-[11px] text-ink-500 mt-0.5">
          WhatsApp kanalımızı takip et — kampanya çıkar çıkmaz görürsün
        </span>
      </span>
      <span className="shrink-0 text-[11px] font-bold text-[#128C7E]">
        Takip et →
      </span>
    </a>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zM12.04 20.15a8.21 8.21 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.27 8.27 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.24-8.25 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.25-8.25 8.25zm4.52-6.18c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.18-.54.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.74 2.66 4.21 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  );
}
