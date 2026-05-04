// halkgunu-web/src/components/ProductCard.tsx
"use client";
import type { HalkgunuProductSummary } from "@/lib/types";
import { productImageUrl } from "@/lib/supabase";
import { discountPercent, formatPrice } from "@/lib/format";
import { useState } from "react";

interface Props {
  product: HalkgunuProductSummary & { store_count?: number };
  onClick: (product: HalkgunuProductSummary) => void;
}

// Ürün kodundan kategori ipucu emoji (geçici, kategori sütunu eklenince kalkar).
function hintFor(kod: string): string {
  const p = kod.split("-")[0];
  const map: Record<string, string> = {
    AYG: "🫒", ZEY: "🫒", DET: "🧴", ŞAM: "🧴", BEZ: "👶",
    KAH: "☕", ÇAY: "🍵", BIS: "🍪", SUT: "🥛", PEY: "🧀",
    YUM: "🥚", MAK: "🍝",
  };
  return map[p] ?? "📦";
}

export function ProductCard({ product, onClick }: Props) {
  const [imgError, setImgError] = useState(false);
  const url = productImageUrl(product.urun_kod);
  const indirim = discountPercent(product.max_normal, product.min_indirimli);
  const initials = product.urun_kod.split("-")[0];

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="group flex flex-col bg-paper-surface border border-paper-border
                 rounded-card overflow-hidden text-left shadow-card
                 hover:border-brand hover:-translate-y-px transition-all duration-150
                 ease-bazaar"
    >
      <div className="relative aspect-square bg-kraft-stripe">
        {imgError ? (
          <div className="absolute inset-0 grid place-items-center gap-1.5">
            <span className="text-3xl opacity-70">{hintFor(product.urun_kod)}</span>
            <span className="text-[10px] font-mono font-bold bg-paper-surface
                             text-ink-700 px-1.5 py-0.5 rounded border border-paper-border">
              {initials}
            </span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt={product.urun_ad ?? product.urun_kod}
            className="absolute inset-0 w-full h-full object-contain p-2"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
        {indirim != null && (
          <div className="tag-discount absolute top-2 -right-1 bg-brand text-white
                          font-display font-extrabold text-xs px-3 py-1 pl-3.5">
            −%{indirim}
          </div>
        )}
        {product.store_count != null && (
          <div className="absolute bottom-1.5 left-1.5 bg-paper-surface text-ink-700
                          text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
            {product.store_count} mağaza
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1">
        <div className="text-[10px] font-mono text-ink-500 tracking-wide">
          {product.urun_kod}
        </div>
        <div className="font-display text-[13px] font-semibold text-ink-900
                        leading-snug line-clamp-2 min-h-[32px]" style={{ textWrap: "pretty" } as any}>
          {product.urun_ad ?? "—"}
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-display text-base font-extrabold text-brand tracking-tightest">
            {formatPrice(product.min_indirimli)}
          </span>
          {product.max_normal != null && product.max_normal > (product.min_indirimli ?? 0) && (
            <span className="text-[11px] text-ink-500 line-through">
              {formatPrice(product.max_normal)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
