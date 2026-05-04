// halkgunu-web/src/components/Header.tsx
"use client";
import { useEffect, useState } from "react";
import { LogoMark, Wordmark } from "./Logo";

interface Props {
  eventCount: number;
  onLocationClick?: () => void;
}

export function Header({ eventCount, onLocationClick }: Props) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (scrolled) {
    return (
      <header className="sticky top-0 z-30 h-12 px-4 flex items-center gap-3
                         bg-paper-bg/90 backdrop-blur border-b border-paper-border">
        <LogoMark size={24} />
        <Wordmark size={14} />
        <button
          onClick={onLocationClick}
          aria-label="Konum izni iste"
          className="ml-auto text-base"
        >📍</button>
      </header>
    );
  }

  return (
    <header className="bg-paper-bg border-b-2 border-dashed border-paper-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <div className="flex flex-col leading-none">
            <Wordmark size={20} />
            <span className="text-[10px] mt-1 tracking-[0.08em] font-bold text-ink-500 uppercase">
              İYİBULUR · {eventCount} ETKİNLİK
            </span>
          </div>
        </div>
        <button
          onClick={onLocationClick}
          aria-label="Konum izni iste"
          className="w-9 h-9 rounded-full bg-paper-surface border border-paper-border
                     grid place-items-center text-base hover:border-brand transition"
        >📍</button>
      </div>
    </header>
  );
}
