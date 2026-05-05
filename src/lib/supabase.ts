import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars",
  );
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

const PRODUCT_BUCKET = "product-images";
const POSTER_BUCKET = "poster-images";

function safeProductCode(kod: string): string {
  return kod.replace(/\//g, "_").replace(/ /g, "_");
}

export function productImageUrl(urunKod: string): string {
  return supabase.storage
    .from(PRODUCT_BUCKET)
    .getPublicUrl(`${safeProductCode(urunKod)}.jpg`).data.publicUrl;
}

interface PosterOpts {
  width?: number;
  quality?: number;
}

export function posterImageUrl(path: string, opts?: PosterOpts): string {
  if (opts && (opts.width || opts.quality)) {
    return supabase.storage.from(POSTER_BUCKET).getPublicUrl(path, {
      transform: {
        width: opts.width,
        quality: opts.quality ?? 90,
        resize: "contain",
      },
    }).data.publicUrl;
  }
  return supabase.storage.from(POSTER_BUCKET).getPublicUrl(path).data.publicUrl;
}
