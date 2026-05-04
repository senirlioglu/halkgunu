// halkgunu-web/src/lib/search.ts
// Türkçe-aware arama. Aksan/diakritik foldlar; "sut" → "süt" eşleşir.

export function foldTr(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

export function matchTr(haystack: string | null | undefined, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  return foldTr(haystack).includes(foldTr(needle));
}
