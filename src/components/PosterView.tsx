"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listEventMappings, listEventPages } from "@/lib/api";
import { posterImageUrl } from "@/lib/supabase";
import type { HalkgunuMapping, HalkgunuPage } from "@/lib/types";
import type { ClickedProduct } from "./StoreModal";
import { track as analyticsTrack } from "@/lib/analytics";

interface Props {
  eventId: string;
  onProductClick: (product: ClickedProduct) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  dragOffset: number;
  dirLocked: boolean;
  isHorizontal: boolean;
  isDragging: boolean;
  isSliding: boolean;
}

const initialTouch: TouchState = {
  startX: 0,
  startY: 0,
  startTime: 0,
  dragOffset: 0,
  dirLocked: false,
  isHorizontal: false,
  isDragging: false,
  isSliding: false,
};

export function PosterView({ eventId, onProductClick }: Props) {
  const [pages, setPages] = useState<HalkgunuPage[]>([]);
  const [mappings, setMappings] = useState<HalkgunuMapping[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgReady, setImgReady] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touch = useRef<TouchState>({ ...initialTouch });
  // Önyüklenen / yüklenmiş ana sayfa src'lerini takip et — swipe sırasında
  // hedef görsel zaten cache'deyse skeleton flash'ını atlayabilelim.
  const loadedSrcs = useRef<Set<string>>(new Set());

  const mainSrc = useCallback(
    (path: string) => posterImageUrl(path, { width: 1200, quality: 85 }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setImgReady(false);
    Promise.all([listEventPages(eventId), listEventMappings(eventId)])
      .then(([p, m]) => {
        if (cancelled) return;
        setPages(p);
        setMappings(m);
        setActiveIdx(0);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const activePage = pages[activeIdx];

  const pageMappings = useMemo(() => {
    if (!activePage) return [];
    return mappings.filter(
      (m) =>
        m.flyer_filename === activePage.flyer_filename &&
        m.page_no === activePage.page_no,
    );
  }, [mappings, activePage]);

  // ─────────────────────────────────────────────────────
  // Tek-parmak yatay swipe → sayfa değiştir
  // Dikey hareket → sayfa scroll'una izin ver (touchAction: pan-y)
  // Direction-lock 4px eşikle; sonra preventDefault + drag.
  // ─────────────────────────────────────────────────────
  // Sayfa kaydırma animasyonu — Ara'daki 3 fazlı slide:
  //   1. Mevcut sayfayı dışarı kaydır (transform: ±wrapW)
  //   2. Karşı tarafa anında ışınla (-wrapW veya +wrapW), aktif sayfayı değiştir
  //   3. Yeni sayfayı içeri kaydır (transform: 0)
  // target === activeIdx → tek fazlı snap-back (parmak bırakıldı, eşik aşılmadı).
  const SLIDE_MS = 300;
  const slideTo = useCallback(
    (target: number, fromDirection: 1 | -1 | null) => {
      const track = trackRef.current;
      const wrap = wrapRef.current;
      if (!track || !wrap) return;

      // Snap-back (aynı sayfa veya geçersiz hedef)
      if (target < 0 || target >= pages.length || target === activeIdx) {
        track.style.transition = `transform ${SLIDE_MS}ms cubic-bezier(0.2,0.8,0.2,1)`;
        track.style.transform = "translateX(0)";
        const onSnapEnd = (ev: TransitionEvent) => {
          if (ev.target !== track || ev.propertyName !== "transform") return;
          track.removeEventListener("transitionend", onSnapEnd);
          track.style.transition = "";
          track.style.transform = "";
          touch.current.isSliding = false;
        };
        track.addEventListener("transitionend", onSnapEnd);
        return;
      }

      const wrapW = wrap.clientWidth;
      const direction =
        fromDirection ?? (target > activeIdx ? -1 : 1); // -1: sola kaydır

      touch.current.isSliding = true;

      // Faz 1: mevcut sayfa dışarı.
      track.style.transition = `transform ${SLIDE_MS}ms cubic-bezier(0.2,0.8,0.2,1)`;
      track.style.transform = `translateX(${direction * wrapW}px)`;

      const onPhase1 = (ev: TransitionEvent) => {
        if (ev.target !== track || ev.propertyName !== "transform") return;
        track.removeEventListener("transitionend", onPhase1);

        // Faz 2: anında karşı tarafa ışınla, görseli değiştir.
        track.style.transition = "";
        track.style.transform = `translateX(${-direction * wrapW}px)`;
        setActiveIdx(target);
        // Hedef görsel önbellekteyse skeleton'ı hiç gösterme — swipe boyunca
        // yeni afiş kaymaya başladığı andan itibaren görünür olsun.
        const targetSrc = mainSrc(pages[target].image_path);
        setImgReady(loadedSrcs.current.has(targetSrc));
        analyticsTrack("poster_page", {
          event_id: eventId,
          page_no: pages[target]?.page_no ?? target + 1,
          method: fromDirection != null ? "swipe_or_arrow" : "thumb",
        });

        // Faz 3: yeni sayfa içeri (iki rAF ile reflow garantisi).
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            track.style.transition = `transform ${SLIDE_MS}ms cubic-bezier(0.2,0.8,0.2,1)`;
            track.style.transform = "translateX(0)";

            const onPhase3 = (ev2: TransitionEvent) => {
              if (ev2.target !== track || ev2.propertyName !== "transform") return;
              track.removeEventListener("transitionend", onPhase3);
              track.style.transition = "";
              track.style.transform = "";
              touch.current.isSliding = false;
            };
            track.addEventListener("transitionend", onPhase3);
          });
        });
      };
      track.addEventListener("transitionend", onPhase1);
    },
    [activeIdx, pages, mainSrc],
  );

  // Komşu (önceki/sonraki) afiş sayfalarını arka planda önyükle. Swipe
  // bitince hedef görsel HTTP cache'inde olur ve skeleton flash'ı kalmaz.
  useEffect(() => {
    if (pages.length <= 1) return;
    [activeIdx - 1, activeIdx + 1].forEach((i) => {
      if (i < 0 || i >= pages.length) return;
      const src = mainSrc(pages[i].image_path);
      if (loadedSrcs.current.has(src)) return;
      const im = new Image();
      im.onload = () => loadedSrcs.current.add(src);
      im.src = src;
    });
  }, [activeIdx, pages, mainSrc]);

  const onTouchEnd = useCallback(() => {
    const s = touch.current;
    if (!s.isDragging) {
      if (trackRef.current) trackRef.current.style.transform = "";
      return;
    }
    const wrapW = wrapRef.current?.clientWidth ?? window.innerWidth;
    const elapsed = Date.now() - s.startTime;
    const velocity = Math.abs(s.dragOffset) / Math.max(1, elapsed);
    const threshold = wrapW * 0.08;
    const shouldSlide =
      Math.abs(s.dragOffset) > threshold ||
      (velocity > 0.3 && Math.abs(s.dragOffset) > 15);

    if (shouldSlide) {
      const direction: 1 | -1 = s.dragOffset > 0 ? 1 : -1;
      const target = activeIdx - direction;
      if (target >= 0 && target < pages.length) {
        slideTo(target, direction);
        return;
      }
    }
    slideTo(activeIdx, null);
  }, [activeIdx, pages.length, slideTo]);

  // React'in onTouch* prop'ları passive bağlandığı için preventDefault çalışmaz.
  // Native listener'ları passive: false ile bağlıyoruz.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onStart = (e: TouchEvent) => {
      if (touch.current.isSliding) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touch.current = {
        ...initialTouch,
        startX: t.clientX,
        startY: t.clientY,
        startTime: Date.now(),
      };
      if (trackRef.current) trackRef.current.style.transition = "";
    };

    const onMove = (e: TouchEvent) => {
      const s = touch.current;
      if (s.isSliding || pages.length <= 1 || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - s.startX;
      const dy = t.clientY - s.startY;

      if (!s.dirLocked && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        s.dirLocked = true;
        s.isHorizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (!s.isHorizontal) return; // dikey scroll'a izin ver

      // Yatay drag → tarayıcı default'unu bastır, kendimiz translate edelim.
      e.preventDefault();
      s.isDragging = true;

      let offset = dx;
      if (
        (activeIdx === 0 && dx > 0) ||
        (activeIdx === pages.length - 1 && dx < 0)
      ) {
        offset = dx * 0.25;
      }
      s.dragOffset = offset;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${offset}px)`;
      }
    };

    track.addEventListener("touchstart", onStart, { passive: true });
    track.addEventListener("touchmove", onMove, { passive: false });
    track.addEventListener("touchend", onTouchEnd);
    track.addEventListener("touchcancel", onTouchEnd);
    return () => {
      track.removeEventListener("touchstart", onStart);
      track.removeEventListener("touchmove", onMove);
      track.removeEventListener("touchend", onTouchEnd);
      track.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [activeIdx, pages.length, onTouchEnd]);

  if (loading) {
    return (
      <div className="aspect-[3/4] rounded-card border border-paper-border bg-paper-surface skeleton" />
    );
  }
  if (error) {
    return <div className="text-center py-10 text-brand">Hata: {error}</div>;
  }
  if (pages.length === 0) {
    return (
      <div className="text-center py-10 text-ink-500">
        Bu etkinlik için afiş henüz yüklenmemiş.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] text-ink-500 -mb-2 px-1">
        Bir ürünün üzerindeki <span aria-hidden>🔍</span> simgesine dokunarak
        satıldığı mağazaları gör.
      </p>

      {pages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => slideTo(i, null)}
              aria-label={p.title || `Sayfa ${i + 1}`}
              className={
                "shrink-0 w-20 h-24 rounded-md overflow-hidden border-2 transition " +
                (i === activeIdx
                  ? "border-brand shadow-card"
                  : "border-paper-border hover:border-ink-300")
              }
              title={p.title || `Sayfa ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterImageUrl(p.image_path, { width: 150, quality: 65 })}
                alt={p.title || `Sayfa ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <div
          ref={wrapRef}
          className="relative w-full bg-paper-surface rounded-card overflow-hidden shadow-card border border-paper-border"
        >
          <div
            ref={trackRef}
            className="relative w-full will-change-transform"
            style={{ touchAction: "pan-y" }}
          >
            {!imgReady && (
              <div className="aspect-[3/4] w-full skeleton rounded-card" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainSrc(activePage.image_path)}
              alt={activePage.title || ""}
              className={
                "w-full h-auto block transition-opacity duration-200 select-none " +
                (imgReady ? "opacity-100" : "opacity-0 absolute")
              }
              fetchPriority="high"
              decoding="async"
              draggable={false}
              onLoad={() => {
                loadedSrcs.current.add(mainSrc(activePage.image_path));
                setImgReady(true);
              }}
            />

            {imgReady &&
              pageMappings.map((m) => {
                const left = `${m.x0 * 100}%`;
                const top = `${m.y0 * 100}%`;
                const width = `${(m.x1 - m.x0) * 100}%`;
                const height = `${(m.y1 - m.y0) * 100}%`;
                const disabled = !m.urun_kodu;

                const onActivate = () => {
                  if (!m.urun_kodu) return;
                  // Drag sonrası gelen sentetik click'i bastır.
                  if (touch.current.isDragging) return;
                  analyticsTrack("product_click", {
                    urun_kod: m.urun_kodu,
                    event_id: eventId,
                    source: "afis",
                    page_no: activePage.page_no,
                  });
                  onProductClick({
                    urun_kod: m.urun_kodu,
                    urun_ad: m.urun_aciklamasi,
                    max_normal: null,
                    min_indirimli: null,
                  });
                };

                return (
                  <button
                    key={m.mapping_id}
                    type="button"
                    onClick={onActivate}
                    disabled={disabled}
                    aria-label={
                      m.urun_kodu
                        ? `${m.urun_kodu}${m.urun_aciklamasi ? " — " + m.urun_aciklamasi : ""}`
                        : "Boş alan"
                    }
                    title={
                      m.urun_kodu
                        ? `${m.urun_kodu}${m.urun_aciklamasi ? " — " + m.urun_aciklamasi : ""}`
                        : ""
                    }
                    className={
                      "absolute group rounded-sm transition " +
                      (disabled
                        ? "cursor-default"
                        : "cursor-pointer hover:bg-brand/5 active:bg-brand/10")
                    }
                    style={{ left, top, width, height }}
                  >
                    {!disabled && (
                      <span
                        aria-hidden
                        className="absolute bottom-1.5 right-1.5
                                   w-9 h-9 rounded-full
                                   grid place-items-center
                                   text-white
                                   transition
                                   group-hover:bg-white/35 group-hover:backdrop-blur-sm group-hover:scale-110
                                   group-active:bg-brand group-active:scale-95"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                        >
                          <circle cx="10" cy="10" r="6" />
                          <line x1="14.5" y1="14.5" x2="20" y2="20" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {pages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => slideTo(activeIdx - 1, null)}
              disabled={activeIdx === 0}
              aria-label="Önceki sayfa"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10
                         w-10 h-10 rounded-full
                         bg-ink-900/85 text-white text-xl
                         grid place-items-center
                         shadow-[0_2px_8px_rgba(0,0,0,0.25)]
                         hover:bg-ink-900 transition
                         disabled:opacity-30 disabled:pointer-events-none"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => slideTo(activeIdx + 1, null)}
              disabled={activeIdx >= pages.length - 1}
              aria-label="Sonraki sayfa"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10
                         w-10 h-10 rounded-full
                         bg-ink-900/85 text-white text-xl
                         grid place-items-center
                         shadow-[0_2px_8px_rgba(0,0,0,0.25)]
                         hover:bg-ink-900 transition
                         disabled:opacity-30 disabled:pointer-events-none"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
