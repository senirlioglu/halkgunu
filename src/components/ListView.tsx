"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { listEventProductSummary } from "@/lib/api";
import type { HalkgunuProductSummary } from "@/lib/types";
import { matchTr } from "@/lib/search";
import { ProductCard } from "./ProductCard";
import { GeoCTA } from "./GeoCTA";
import {
  DEFAULT_FILTER,
  FilterSheet,
  filterToQuery,
  queryToFilter,
  type FilterState,
} from "./FilterSheet";

interface Props {
  eventId: string;
  onProductClick: (product: HalkgunuProductSummary) => void;
  onGeoPermission?: (
    granted: boolean,
    pos?: { lat: number; lng: number } | null,
  ) => void;
}

const SORT_LABEL: Record<FilterState["sort"], string> = {
  indirim: "En çok indirim",
  fiyat_artan: "En düşük fiyat",
  fiyat_azalan: "En yüksek fiyat",
  yakinlik: "Yakınlık",
  stok: "Stoğu en fazla",
};

// Geçici kategori türetimi — urun_kod prefix'inden. Backend'e kategori sütunu
// eklenince burası kalkar.
const CAT_PREFIX: Record<string, string> = {
  AYG: "Gıda", ZEY: "Gıda", SUT: "Gıda", PEY: "Gıda", YUM: "Gıda",
  BIS: "Gıda", MAK: "Gıda",
  KAH: "İçecek", ÇAY: "İçecek",
  DET: "Temizlik", ŞAM: "Temizlik",
  BEZ: "Bebek",
};
function categoryOf(kod: string): string | null {
  return CAT_PREFIX[kod.split("-")[0]] ?? null;
}

export function ListView({ eventId, onProductClick, onGeoPermission }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<HalkgunuProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hasGeo, setHasGeo] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filter = useMemo<FilterState>(
    () => queryToFilter(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilter = (next: FilterState) => {
    const sp = filterToQuery(next);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

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

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const c = categoryOf(p.urun_kod);
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const filtered = useMemo(() => {
    let arr = products;
    if (query.trim()) {
      arr = arr.filter(
        (p) => matchTr(p.urun_kod, query) || matchTr(p.urun_ad, query),
      );
    }
    if (filter.categories.length > 0) {
      arr = arr.filter((p) => {
        const c = categoryOf(p.urun_kod);
        return c != null && filter.categories.includes(c);
      });
    }
    if (filter.minDiscount > 0) {
      arr = arr.filter((p) => {
        if (p.max_normal == null || p.min_indirimli == null) return false;
        if (p.max_normal <= 0) return false;
        const pct = (1 - p.min_indirimli / p.max_normal) * 100;
        return pct >= filter.minDiscount;
      });
    }
    const sorted = [...arr];
    if (filter.sort === "indirim") {
      sorted.sort((a, b) => {
        const da =
          a.max_normal && a.min_indirimli != null
            ? 1 - a.min_indirimli / a.max_normal
            : 0;
        const db =
          b.max_normal && b.min_indirimli != null
            ? 1 - b.min_indirimli / b.max_normal
            : 0;
        return db - da;
      });
    } else if (filter.sort === "fiyat_artan") {
      sorted.sort(
        (a, b) =>
          (a.min_indirimli ?? Infinity) - (b.min_indirimli ?? Infinity),
      );
    } else if (filter.sort === "fiyat_azalan") {
      sorted.sort(
        (a, b) =>
          (b.min_indirimli ?? -Infinity) - (a.min_indirimli ?? -Infinity),
      );
    }
    return sorted;
  }, [products, query, filter]);

  const activeFilterCount =
    filter.categories.length +
    filter.stores.length +
    (filter.minDiscount > 0 ? 1 : 0);

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

      <GeoCTA
        onPermission={(g, pos) => {
          setHasGeo(g);
          onGeoPermission?.(g, pos);
        }}
      />

      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-ink-500">{filtered.length} ürün</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                       border border-paper-border bg-paper-surface text-[12px]
                       font-semibold text-ink-700"
          >
            ⚙ Filtre
            {activeFilterCount > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                       border border-paper-border bg-paper-surface text-[12px]
                       font-semibold text-ink-700"
          >
            ↕ {SORT_LABEL[filter.sort]}
          </button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((p) => (
          <ProductCard key={p.urun_kod} product={p} onClick={onProductClick} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-6 text-ink-500">
          {query
            ? `"${query}" için sonuç yok.`
            : "Filtreyle eşleşen ürün yok."}
          <button
            onClick={() => {
              setQuery("");
              setFilter(DEFAULT_FILTER);
            }}
            className="ml-2 underline text-brand"
          >
            Filtreleri temizle
          </button>
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={filter}
        onChange={setFilter}
        allCategories={allCategories}
        allStores={[]}
        matchCount={filtered.length}
        hasGeo={hasGeo}
      />
    </div>
  );
}
