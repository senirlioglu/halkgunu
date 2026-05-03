// halkgunu_schema.sql tablolarına karşılık gelen TypeScript tipleri.

export type EventStatus = "draft" | "active" | "archived";

export interface HalkgunuEvent {
  event_id: string;
  event_name: string;
  event_date: string; // ISO yyyy-mm-dd
  status: EventStatus;
  sort_order: number | null;
}

export interface HalkgunuPage {
  id: number;
  event_id: string;
  flyer_filename: string;
  page_no: number;
  image_path: string;
  title: string | null;
  sort_order: number | null;
}

export interface HalkgunuMapping {
  mapping_id: number;
  event_id: string;
  flyer_filename: string;
  page_no: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  urun_kodu: string | null;
  urun_aciklamasi: string | null;
  afis_fiyat: string | null;
}

// Liste görünümü için distinct ürün satırı (admin'in get_event_product_summary çıktısı).
export interface HalkgunuProductSummary {
  urun_kod: string;
  urun_ad: string | null;
  min_indirimli: number | null;
  max_normal: number | null;
}

// Mağaza listesi (RPC: get_halkgunu_product_stores)
export interface HalkgunuProductStore {
  magaza_kod: string;
  magaza_adi: string | null;
  latitude: number | null;
  longitude: number | null;
  adres: string | null;
  normal_fiyat: number | null;
  indirimli_fiyat: number | null;
  stok_adet: number;
}
