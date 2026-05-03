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
// (RPC tanımlamadık çünkü PostgREST üzerinden çekip JS'de gruplamak yeterli.)
export async function listEventProductSummary(
  eventId: string,
): Promise<HalkgunuProductSummary[]> {
  const { data, error } = await supabase
    .from("halkgunu_products")
    .select("urun_kod, urun_ad, normal_fiyat, indirimli_fiyat")
    .eq("event_id", eventId);
  if (error) throw error;

  const byKod = new Map<string, HalkgunuProductSummary>();
  for (const row of data ?? []) {
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
  return Array.from(byKod.values()).sort((a, b) =>
    a.urun_kod.localeCompare(b.urun_kod, "tr"),
  );
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
