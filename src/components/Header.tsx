// halkgunu-web/src/components/Header.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark, Wordmark } from "./Logo";
import { WhatsAppFollow } from "./WhatsAppFollow";

interface Props {
  eventCount?: number;
}

export function Header({ eventCount }: Props) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (scrolled) {
    return (
      <header
        className="sticky top-0 z-30 h-12 px-4 flex items-center gap-3
                   bg-paper-bg/90 backdrop-blur border-b border-paper-border"
      >
        <Link
          href="/"
          aria-label="Anasayfa"
          className="flex items-center gap-2 rounded-md hover:opacity-80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper-bg"
        >
          <LogoMark size={24} />
          <Wordmark size={14} />
        </Link>
        <div className="ml-auto">
          <WhatsAppFollow compact />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-paper-bg border-b-2 border-dashed border-paper-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Anasayfa"
          className="flex items-center gap-2.5 rounded-md hover:opacity-80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper-bg"
        >
          <LogoMark size={36} />
          <div className="flex flex-col leading-none">
            <Wordmark size={20} />
            {eventCount != null && eventCount > 0 && (
              <span className="text-[10px] mt-1 tracking-[0.08em] font-bold text-ink-500 uppercase">
                İYİBULUR · {eventCount} ETKİNLİK
              </span>
            )}
          </div>
        </Link>
        <WhatsAppFollow compact />
      </div>
    </header>
  );
}
