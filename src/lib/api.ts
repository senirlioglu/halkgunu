import { supabase } from "./supabase";
import type {
  HalkgunuEvent,
  HalkgunuEventPhoto,
  HalkgunuMapping,
  HalkgunuPage,
  HalkgunuProductStore,
  HalkgunuProductSummary,
} from "./types";

export async function listActiveEvents(): Promise<HalkgunuEvent[]> {
  const { data, error } = await supabase
    .from("halkgunu_events")
    .select("event_id, event_name, event_date, status, sort_order")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("event_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listEventPages(eventId: string): Promise<HalkgunuPage[]> {
  const { data, error } = await supabase
    .from("halkgunu_pages")
    .select("id, event_id, flyer_filename, page_no, image_path, title, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("flyer_filename", { ascending: true })
    .order("page_no", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listEventMappings(
  eventId: string,
): Promise<HalkgunuMapping[]> {
  const { data, error } = await supabase
    .from("halkgunu_mappings")
    .select(
      "mapping_id, event_id, flyer_filename, page_no, x0, y0, x1, y1, urun_kodu, urun_aciklamasi, afis_fiyat",
    )
    .eq("event_id", eventId);
  if (error) throw error;
  return data ?? [];
}

// Distinct ürün özeti — admin _admin_halkgunu_list_mode ile aynı agregasyonu yapar.
// halkgunu_product_order varsa display_sort önceliğine, yoksa urun_kod'a göre sıralar.
export async function listEventProductSummary(
  eventId: string,
): Promise<HalkgunuProductSummary[]> {
  const [productsResult, orderResult] = await Promise.all([
    supabase
      .from("halkgunu_products")
      .select("urun_kod, urun_ad, normal_fiyat, indirimli_fiyat")
      .eq("event_id", eventId),
    supabase
      .from("halkgunu_product_order")
      .select("urun_kod, display_sort")
      .eq("event_id", eventId),
  ]);
  if (productsResult.error) throw productsResult.error;
  // Sıralama tablosu hata verirse (yok varsayalım) sessizce devam et.
  const orderRows = orderResult.error ? [] : (orderResult.data ?? []);
  const orderMap = new Map<string, number>();
  for (const r of orderRows) {
    if (r.urun_kod) orderMap.set(r.urun_kod, (r.display_sort as number) ?? 0);
  }

  const byKod = new Map<string, HalkgunuProductSummary>();
  for (const row of productsResult.data ?? []) {
    const kod = row.urun_kod;
    if (!kod) continue;
    const ind = row.indirimli_fiyat as number | null;
    const nor = row.normal_fiyat as number | null;
    const cur = byKod.get(kod);
    if (!cur) {
      byKod.set(kod, {
        urun_kod: kod,
        urun_ad: row.urun_ad ?? null,
        min_indirimli: ind,
        max_normal: nor,
      });
    } else {
      if (ind != null && (cur.min_indirimli == null || ind < cur.min_indirimli)) {
        cur.min_indirimli = ind;
      }
      if (nor != null && (cur.max_normal == null || nor > cur.max_normal)) {
        cur.max_normal = nor;
      }
      if (!cur.urun_ad && row.urun_ad) cur.urun_ad = row.urun_ad;
    }
  }
  // display_sort > 0 olanlar önce (artan), sonra alfabetik kalanlar.
  return Array.from(byKod.values()).sort((a, b) => {
    const sa = orderMap.get(a.urun_kod) ?? 0;
    const sb = orderMap.get(b.urun_kod) ?? 0;
    if (sa !== sb) {
      // 0 (sıralanmamış) en sona, sıralı olanlar artan.
      if (sa === 0) return 1;
      if (sb === 0) return -1;
      return sa - sb;
    }
    return a.urun_kod.localeCompare(b.urun_kod, "tr");
  });
}

export interface EventStoreCatalog {
  // urun_kod → mağaza kodları (filtre için)
  storeMap: Record<string, string[]>;
  // distinct mağaza listesi (filtre arayüzü için, magaza_adi ile)
  stores: { magaza_kod: string; magaza_adi: string | null }[];
}

export async function listEventStoreCatalog(
  eventId: string,
): Promise<EventStoreCatalog> {
  const { data: prods, error: e1 } = await supabase
    .from("halkgunu_products")
    .select("urun_kod, magaza_kod")
    .eq("event_id", eventId);
  if (e1) throw e1;

  const map: Record<string, Set<string>> = {};
  const kodSet = new Set<string>();
  for (const r of prods ?? []) {
    if (!r.urun_kod || !r.magaza_kod) continue;
    (map[r.urun_kod] ??= new Set()).add(r.magaza_kod);
    kodSet.add(r.magaza_kod);
  }

  let stores: { magaza_kod: string; magaza_adi: string | null }[] = [];
  if (kodSet.size > 0) {
    const { data: rows, error: e2 } = await supabase
      .from("magazalar")
      .select("magaza_kod, magaza_adi")
      .in("magaza_kod", Array.from(kodSet));
    if (!e2 && rows) {
      stores = rows as typeof stores;
    } else {
      stores = Array.from(kodSet).map((k) => ({
        magaza_kod: k,
        magaza_adi: null,
      }));
    }
  }
  stores.sort((a, b) =>
    (a.magaza_adi ?? a.magaza_kod).localeCompare(
      b.magaza_adi ?? b.magaza_kod,
      "tr",
    ),
  );

  const storeMap: Record<string, string[]> = {};
  for (const k of Object.keys(map)) storeMap[k] = Array.from(map[k]);

  return { storeMap, stores };
}

export async function listEventPhotos(
  eventId: string,
): Promise<HalkgunuEventPhoto[]> {
  const { data, error } = await supabase.rpc("get_halkgunu_event_photos", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data ?? []) as HalkgunuEventPhoto[];
}

export async function getProductStores(
  eventId: string,
  urunKod: string,
): Promise<HalkgunuProductStore[]> {
  const { data, error } = await supabase.rpc("get_halkgunu_product_stores", {
    p_event_id: eventId,
    p_urun_kod: urunKod,
  });
  if (error) throw error;
  return (data ?? []) as HalkgunuProductStore[];
}
