// halkgunu-web/src/components/FilterSheet.tsx
// PR-5 — Filtre & sıralama bottom-sheet
// URL query param ile state senkron: ?cat=Gida,Temizlik&store=M01,M02&sort=indirim&min=20
"use client";

import { useEffect, useMemo, useState } from "react";
import { matchTr } from "@/lib/search";

export type SortKey =
  | "oneri"
  | "indirim"
  | "fiyat_artan"
  | "fiyat_azalan"
  | "yakinlik"
  | "stok";

export interface FilterState {
  categories: string[];        // seçili kategori adları
  stores: string[];            // seçili magaza_kod'ları
  minDiscount: number;         // 0-70
  sort: SortKey;
}

export const DEFAULT_FILTER: FilterState = {
  categories: [], stores: [], minDiscount: 0, sort: "oneri",
};

interface Props {
  open: boolean;
  onClose: () => void;
  value: FilterState;
  onChange: (next: FilterState) => void;
  // veri kaynakları
  allCategories: string[];     // örn ["Gıda","Temizlik","İçecek"]
  allStores: { magaza_kod: string; magaza_adi: string | null }[];
  // butonun göstereceği eşleşen ürün sayısı
  matchCount: number;
  // konum izni durumu — yoksa Yakınlık disabled
  hasGeo: boolean;
}

export function FilterSheet({
  open, onClose, value, onChange, allCategories, allStores, matchCount, hasGeo,
}: Props) {
  // sheet içinde local state — Uygula'ya basınca üst state'e yaz
  const [draft, setDraft] = useState<FilterState>(value);
  const [storeQuery, setStoreQuery] = useState("");

  useEffect(() => { if (open) setDraft(value); }, [open, value]);

  // ESC + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  const toggle = (key: "categories" | "stores", val: string) =>
    setDraft(d => ({
      ...d,
      [key]: d[key].includes(val) ? d[key].filter(x => x !== val) : [...d[key], val],
    }));

  const filteredStores = useMemo(
    () => allStores.filter(s => matchTr(s.magaza_adi ?? s.magaza_kod, storeQuery)),
    [allStores, storeQuery],
  );

  const activeCount =
    draft.categories.length + draft.stores.length +
    (draft.minDiscount > 0 ? 1 : 0) + (draft.sort !== "indirim" ? 1 : 0);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Filtre ve sıralama"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="bg-paper-surface w-full max-w-2xl max-h-[88vh] flex flex-col
                   rounded-t-sheet shadow-sheet animate-slideUp">

        <div className="pt-2 pb-1"><div className="sheet-handle" /></div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-paper-border">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-extrabold text-ink-900">Filtre & Sıralama</span>
            {activeCount > 0 && (
              <span className="text-[10px] font-bold bg-brand text-white px-2 py-0.5 rounded-full">
                {activeCount} aktif
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setDraft(DEFAULT_FILTER)}
              className="text-[12px] font-semibold text-ink-500 px-2 py-1">
              Temizle
            </button>
            <button onClick={onClose} aria-label="Kapat"
              className="text-ink-500 text-2xl leading-none px-1.5">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

          {/* Sıralama (radio) */}
          <Section title="Sıralama">
            <div className="grid grid-cols-1 gap-1.5">
              {([
                ["oneri", "Önerilen sıralama", false],
                ["indirim", "En çok indirim", false],
                ["fiyat_artan", "En düşük fiyat", false],
                ["fiyat_azalan", "En yüksek fiyat", false],
                ["yakinlik", "Yakınlık", !hasGeo],
                ["stok", "Stoğu en fazla", false],
              ] as [SortKey, string, boolean][]).map(([k, l, dis]) => (
                <button key={k}
                  disabled={dis}
                  onClick={() => setDraft(d => ({ ...d, sort: k }))}
                  className={
                    "flex items-center justify-between px-3 py-2.5 rounded-card border text-[13px] font-semibold transition " +
                    (draft.sort === k
                      ? "bg-brand-soft border-brand text-brand"
                      : dis
                        ? "bg-paper-bg border-paper-border text-ink-300 cursor-not-allowed"
                        : "bg-paper-surface border-paper-border text-ink-700")
                  }>
                  <span>{l}</span>
                  <span className={
                    "w-4 h-4 rounded-full border-2 grid place-items-center " +
                    (draft.sort === k ? "border-brand" : "border-paper-border")
                  }>
                    {draft.sort === k && <span className="w-2 h-2 rounded-full bg-brand" />}
                  </span>
                </button>
              ))}
              {!hasGeo && (
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Yakınlığa göre sıralamak için konum izni gerekir.
                </p>
              )}
            </div>
          </Section>

          {/* Min indirim slider */}
          <Section title="En az indirim">
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={70} step={5}
                value={draft.minDiscount}
                onChange={(e) => setDraft(d => ({ ...d, minDiscount: Number(e.target.value) }))}
                className="flex-1 accent-brand" />
              <span className="font-display text-base font-extrabold text-brand min-w-[3.5rem] text-right">
                %{draft.minDiscount}
              </span>
            </div>
          </Section>

          {/* Kategori chips */}
          {allCategories.length > 0 && (
            <Section title="Kategori" count={draft.categories.length}>
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map(cat => {
                  const active = draft.categories.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggle("categories", cat)}
                      className={
                        "px-3 py-1.5 rounded-full text-[12px] font-semibold border transition " +
                        (active
                          ? "bg-ink-900 text-white border-ink-900"
                          : "bg-paper-surface text-ink-700 border-paper-border")
                      }>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Mağaza search + multi-select */}
          <Section title="Mağaza" count={draft.stores.length}>
            <input type="search" value={storeQuery}
              onChange={(e) => setStoreQuery(e.target.value)}
              placeholder="Mağaza ara…"
              className="w-full rounded-card border border-paper-border bg-paper-surface px-3 py-2 text-[13px] focus:outline-none focus:border-brand focus:border-2" />
            <div className="mt-2 max-h-56 overflow-y-auto border border-paper-border rounded-card divide-y divide-paper-border">
              {filteredStores.length === 0 && (
                <div className="text-center text-ink-500 text-[12px] py-4">Sonuç yok.</div>
              )}
              {filteredStores.map(s => {
                const active = draft.stores.includes(s.magaza_kod);
                return (
                  <label key={s.magaza_kod}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-paper-bg">
                    <input type="checkbox" checked={active}
                      onChange={() => toggle("stores", s.magaza_kod)}
                      className="accent-brand w-4 h-4" />
                    <span className="text-[13px] text-ink-900 flex-1 truncate">
                      {s.magaza_adi ?? s.magaza_kod}
                    </span>
                    <span className="text-[10px] font-mono text-ink-500">{s.magaza_kod}</span>
                  </label>
                );
              })}
            </div>
          </Section>

        </div>

        {/* Sticky Apply */}
        <div className="px-4 py-3 border-t border-paper-border bg-paper-surface">
          <button
            onClick={() => { onChange(draft); onClose(); }}
            className="w-full rounded-card bg-brand text-white font-display text-base font-extrabold py-3 active:bg-brand-dark transition">
            Uygula · {matchCount} ürün
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-[13px] font-extrabold tracking-tight text-ink-900 uppercase">
          {title}
        </h3>
        {count != null && count > 0 && (
          <span className="text-[10px] font-bold bg-brand-soft text-brand px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// URL ↔ FilterState senkron — sayfa içinde böyle kullan:
// ─────────────────────────────────────────────
export function filterToQuery(f: FilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.categories.length) sp.set("cat", f.categories.join(","));
  if (f.stores.length) sp.set("store", f.stores.join(","));
  if (f.minDiscount > 0) sp.set("min", String(f.minDiscount));
  if (f.sort !== "oneri") sp.set("sort", f.sort);
  return sp;
}

export function queryToFilter(sp: URLSearchParams): FilterState {
  return {
    categories: sp.get("cat")?.split(",").filter(Boolean) ?? [],
    stores: sp.get("store")?.split(",").filter(Boolean) ?? [],
    minDiscount: Number(sp.get("min") ?? 0) || 0,
    sort: ((sp.get("sort") as SortKey) ?? "oneri"),
  };
}
