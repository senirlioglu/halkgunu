const _tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return _tl.format(value);
}

const _date = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatEventDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return _date.format(d);
}

export function formatShortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

// İndirim yüzdesi (Ara'daki rozetle uyumlu)
export function discountPercent(
  normal: number | null | undefined,
  indirimli: number | null | undefined,
): number | null {
  if (normal == null || indirimli == null) return null;
  if (normal <= 0 || indirimli >= normal) return null;
  return Math.round((1 - indirimli / normal) * 100);
}
