"use client";

import { CATEGORIES, categoryOf } from "@/lib/categories";

interface Props {
  // tüm ürünlerden türetilen kategori adları (sadece dolu olanlar)
  productCodes: string[];
  selected: string[];
  onToggle: (cat: string) => void;
  onClear: () => void;
}

export function CategoryPills({
  productCodes,
  selected,
  onToggle,
  onClear,
}: Props) {
  const counts: Record<string, number> = {};
  for (const k of productCodes) {
    const c = categoryOf(k);
    if (!c) continue;
    counts[c] = (counts[c] ?? 0) + 1;
  }
  const present = Object.keys(CATEGORIES)
    .map((p) => CATEGORIES[p])
    .filter((name) => (counts[name] ?? 0) > 0);

  if (present.length === 0) return null;

  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mb-3">
      <div className="flex gap-1.5">
        <button
          onClick={onClear}
          className={
            "shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-semibold border transition " +
            (selected.length === 0
              ? "bg-ink-900 text-white border-ink-900"
              : "bg-paper-surface text-ink-700 border-paper-border")
          }
        >
          Tümü
        </button>
        {present.map((cat) => {
          const active = selected.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              className={
                "shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-semibold border transition " +
                (active
                  ? "bg-ink-900 text-white border-ink-900"
                  : "bg-paper-surface text-ink-700 border-paper-border hover:border-ink-300")
              }
            >
              {cat}
              <span
                className={
                  "ml-1.5 text-[10px] " +
                  (active ? "text-white/70" : "text-ink-500")
                }
              >
                {counts[cat]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
