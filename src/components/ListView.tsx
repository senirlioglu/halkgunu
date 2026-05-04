"use client";

import { useEffect, useMemo, useState } from "react";
import { listEventProductSummary } from "@/lib/api";
import type { HalkgunuProductSummary } from "@/lib/types";
import { matchTr } from "@/lib/search";
import { ProductCard } from "./ProductCard";
import { GeoCTA } from "./GeoCTA";

interface Props {
  eventId: string;
  onProductClick: (urunKod: string) => void;
  onGeoPermission?: (granted: boolean) => void;
}

export function ListView({ eventId, onProductClick, onGeoPermission }: Props) {
  const [products, setProducts] = useState<HalkgunuProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listEventProductSummary(eventId)
      .then((rows) => !cancelled && setProducts(rows))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    return products.filter(
      (p) => matchTr(p.urun_kod, query) || matchTr(p.urun_ad, query),
    );
  }, [query, products]);

  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-card border border-paper-border bg-paper-surface skeleton"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-center py-10 text-brand">Hata: {error}</div>;
  }
  if (products.length === 0) {
    return (
      <div className="text-center py-10 text-ink-500">
        Bu etkinlik için ürün listesi henüz hazır değil.
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-3">
        <span
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm"
        >
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ürün adı veya kodu ara…"
          className="w-full rounded-card border border-paper-border bg-paper-surface
                     pl-9 pr-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500
                     focus:outline-none focus:border-brand focus:border-2"
        />
      </div>

      <GeoCTA onPermission={onGeoPermission} />

      <div className="text-xs text-ink-500 mb-2 mt-1">
        {filtered.length} ürün
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((p) => (
          <ProductCard key={p.urun_kod} product={p} onClick={onProductClick} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-6 text-ink-500">
          &ldquo;{query}&rdquo; için sonuç yok.
        </div>
      )}
    </div>
  );
}
