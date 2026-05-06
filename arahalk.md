# Ara — Halk Günü Admin Devir Notu

**Hedef:** Ara'nın "Halk Günü" admin sekmesinde iki eksik parçayı tamamla:
1. **"Bizden Fotoğraflar"** yönetim ekranı (foto upload + listele + sil)
2. **Ürün sıralaması (manuel reorder)** — drag-drop ile event başına ürün sırasını belirleme + kaydet

Bu doküman halkgunu (frontend) tarafının bittiği noktayı ve admin'den beklediklerini özetler. İlk iş: aşağıdaki "Sıfırıncı Adım"ı yap, mevcut durumu yerinde gör, sonra eksik parçaları ekle.

---

## 0. Sıfırıncı adım — bağlamı doğrula

Ara repo'sunda Halk Günü admin sekmesinin bulunduğu Streamlit modülünü aç (muhtemelen `pages/` veya `tabs/` altında `halkgunu` adlı bir dosya/klasör). Şunları kontrol et ve her madde için **var/yok** cevabını netleştir:

1. **Etkinlik (event) yönetimi** — `halkgunu_events` için CRUD: oluştur/listele/aktif et/arşivle, sort_order düzenle.
2. **Ürün yönetimi** — Excel import → `halkgunu_products` (event_id, urun_kod, urun_ad, magaza_kod, normal_fiyat, indirimli_fiyat).
3. **Afiş (poster) yönetimi** — `halkgunu_pages` upload (PDF/JPG → bucket: `poster-images`, path: `halkgunu/{event_id}/{filename}_p{n}.jpg`) + `halkgunu_mappings` bbox eşleştirme.
4. **Fotoğraf yönetimi (`halkgunu_photos`)** — **YOK**, eklenecek olan.
5. **Ürün sıralama yönetimi (`halkgunu_product_order`)** — **YOK**, eklenecek olan.

Kullanıcının iddiası: 1, 2, 3 yapıldı; 4 ve 5 eksik. Doğrula. Eksik bulduğun farklı şeyler varsa kullanıcıya bildir, bu oturumun ana işi madde **4 ve 5**.

---

## 1. Halkgunu (frontend) tarafı — bitti

| Parça | Durum |
|---|---|
| Next.js app (`halkgunu.net`) | Vercel'de canlı |
| Repo | `senirlioglu/halkgunu`, `main` branch |
| Sekmeler (üst tab bar) | Etkinlik tarihleri (mor) + **Afiş** (sarı, `hasPoster` ise) + **Bizden Fotoğraflar** (yeşil, `hasPhotos` ise) |
| View'lar | `ListView` (ürün kartı + indirim rozeti), `PosterView` (bbox tıklanır), `PhotosView` (foto grid + mağaza adı/adres + Google Maps linki), `StoreModal` |
| RPC bağımlılığı | `get_halkgunu_product_stores`, `get_halkgunu_event_photos` |
| RLS | Tüm halkgunu_* tabloları RLS açık; anon `SELECT` policy'si var, sadece `status='active'` etkinliklere bağlı satırları görür |

---

## 2. Eklenecek tablo & RPC — **zaten Supabase'de hazır**

Aşağıdaki SQL **Supabase'e uygulandı**. Sen DDL çalıştırmıyorsun, sadece referans için:

```sql
CREATE TABLE halkgunu_photos (
    id          BIGSERIAL PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES halkgunu_events(event_id) ON DELETE CASCADE,
    magaza_kod  TEXT,                    -- NULL olabilir; mağazaya bağlı olmayan fotoğraflar için
    image_path  TEXT NOT NULL,           -- "photos/{event_id}/{filename}.jpg" (poster-images bucket)
    caption     TEXT,                    -- NULL olabilir
    sort_order  INTEGER DEFAULT 0,       -- Frontend grid sırası (artan)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_halkgunu_photos_event
    ON halkgunu_photos (event_id, sort_order, id);

-- RPC: mağaza adı/adres/lat-lon join'lu
CREATE FUNCTION get_halkgunu_event_photos(p_event_id TEXT)
RETURNS TABLE(
    id BIGINT, image_path TEXT, caption TEXT,
    magaza_kod TEXT, magaza_adi TEXT, adres TEXT,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    sort_order INTEGER
) ...

-- RLS
ALTER TABLE halkgunu_photos ENABLE ROW LEVEL SECURITY;
-- anon SELECT policy: status='active' event'lere bağlı
GRANT EXECUTE ON FUNCTION get_halkgunu_event_photos(TEXT) TO anon;
```

**Storage:**
- Bucket: `poster-images` (afişlerle aynı, ayrı bucket açma)
- Path konvansiyonu: `photos/{event_id}/{filename}.jpg`
- Bucket public — frontend `getPublicUrl` ile çekiyor

---

## 3. Frontend kontratı (UI'ı buna göre tasarla)

`PhotosView` her foto için şunları gösteriyor:
- **Görsel** — `posterImageUrl(image_path)` ile (poster-images bucket public URL'i)
- **Mağaza adı** — `magaza_adi` (RPC'den `magazalar` join'iyle gelir)
- **Adres** — `adres` (mağaza tablosundan)
- **Caption** — varsa (admin'in girdiği serbest metin)
- **"Haritada göster →"** — `latitude`/`longitude` varsa koordinata, yoksa adrese, ikisi de yoksa link gizli

`magaza_kod` NULL ise mağaza bilgisi gösterilmez (sadece görsel + caption). Yani mağaza ataması zorunlu değil.

`hasPhotos = (count > 0)` olduğunda yeşil sekme görünür. Sayı 0 olunca sekme gizlenir, kullanıcı sıfır-state görmez.

---

## 4. Yapılacak iş — "Bizden Fotoğraflar" admin alt sekmesi

Mevcut Halk Günü admin sekmesine, ürün/afiş yönetimi gibi **alt-sekme** olarak ekle. Tasarım Ara'nın mevcut Streamlit pattern'ine uysun (sekme stili, expander kullanımı, butonlar, alert mesajları — diğer Halk Günü ekranlarındaki konvansiyonu birebir takip et).

### Gerekli özellikler

1. **Etkinlik seçici** — diğer alt sekmelerde nasılsa öyle (genelde üstteki ortak event picker'dan miras alıyordur, kontrol et).

2. **Yeni fotoğraf yükleme**
   - `st.file_uploader(..., type=["jpg","jpeg","png"], accept_multiple_files=True)`
   - Mağaza dropdown — `magazalar` tablosundan, **opsiyonel** ("(mağaza yok)" seçeneği)
   - Caption text input — opsiyonel
   - Sort order — opsiyonel, boş bırakılırsa max+1 ata
   - "Yükle" butonu:
     - Her dosya için: `poster-images/photos/{event_id}/{uuid_or_slug}.jpg` yoluna upload
     - DB'ye `INSERT INTO halkgunu_photos (...)` satır ekle
     - Başarı/hata mesajı

3. **Mevcut fotoğraflar listesi**
   - Mevcut etkinlik için `halkgunu_photos` (sort_order, id ASC) listele
   - Her satırda: thumbnail (storage public URL), mağaza dropdown (değiştirilebilir), caption (düzenlenebilir), sort_order (numeric input), **Sil** butonu
   - "Kaydet" → değişiklikleri UPDATE et
   - "Sil" → DB'den DELETE + storage'dan dosyayı da sil (opsiyonel ama temiz olur)

4. **Storage path generator** — Ara'da muhtemelen mevcut helper'lar var (`upload_to_supabase_storage` benzeri). Onları kullan, kendi util'ini yazma. Yoksa basit:
   ```python
   import uuid, pathlib
   ext = pathlib.Path(uploaded_file.name).suffix.lower()
   path = f"photos/{event_id}/{uuid.uuid4().hex}{ext}"
   supabase.storage.from_("poster-images").upload(path, uploaded_file.getvalue(), {"content-type": uploaded_file.type})
   ```

### Yazma izni / RLS

Admin Streamlit `service_role` key kullanıyor olmalı (Ara'nın mevcut supabase client'ına bak — büyük ihtimal env'de `SUPABASE_SERVICE_ROLE_KEY` var). `service_role` RLS'i bypass eder, INSERT/UPDATE/DELETE doğrudan çalışır. Anon key kullanıyorsan halkgunu_photos'a yazma policy'si yok → 403 alırsın, durup `service_role` client'ına geç.

### Kabul kriterleri

- [ ] Admin → Halk Günü → "Bizden Fotoğraflar" sekmesi açılıyor
- [ ] Bir aktif etkinlik seçili iken, foto yükleyince:
  - Storage'da `poster-images/photos/{event_id}/...` altında dosya görünüyor
  - DB'de `halkgunu_photos` satırı var
  - Halkgunu.net refresh edilince yeşil "Bizden Fotoğraflar" sekmesi geliyor, foto + mağaza adı/adres + harita linki gözüküyor
- [ ] Caption düzenleyince frontend'de güncel metin görünüyor
- [ ] Sil işlemi DB'yi temizliyor; tekrar refresh edince frontend'de foto kayboluyor
- [ ] Sort_order değişince frontend grid sırası buna göre değişiyor

---

## 5. Test bağlamı

Frontend test event'i mevcut: `event_id = 'test-2026-05-15'`, status='active'. Üstüne foto yükleyip canlıda doğrulayabilirsin. Test sonrası temizlik:
```sql
DELETE FROM halkgunu_photos WHERE event_id = 'test-2026-05-15';
-- ve storage'dan ilgili dosyaları sil
```

Canlı için gerçek event'ler henüz yok; ürün/Afiş eksenli yönetim akışında olduğu gibi normal kullanım: önce event yarat → sonra foto yükle.

---

## 6. Yapma / dikkat et

- **Yeni bucket açma** — `poster-images` yeterli, prefix'le ayrılıyor
- **Frontend kodunu değiştirme** — kontrat sabit, frontend bekleyen alanları DB'ye doğru yaz
- **`magazalar` tablosuna yazma** — bu Ara'nın ana mağaza tablosu, sadece okuma (foreign key implicit, `halkgunu_photos.magaza_kod` magazalar.magaza_kod ile eşleşir)
- **RLS policy ekleme** — zaten var, dokunma
- **`status='draft'`/`'archived'` event'lere foto yükleme tarafı sınırlı değil** ama RLS yüzünden frontend göremez. Admin tarafında uyarı göstermek istersen göster, zorunluluk değil.

---

## 7. İkinci yapılacak iş — Ürün sıralama (manuel reorder)

### Tablo & RLS — **Supabase'e zaten uygulandı**

Frontend referansı için:

```sql
CREATE TABLE halkgunu_product_order (
    event_id     TEXT NOT NULL REFERENCES halkgunu_events(event_id) ON DELETE CASCADE,
    urun_kod     TEXT NOT NULL,
    display_sort INTEGER NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, urun_kod)
);
-- RLS: anon SELECT (status='active' event), service_role bypass.
```

### Frontend kontratı

Halkgunu.net `listEventProductSummary` artık `halkgunu_product_order`'ı LEFT JOIN okuyor:
- `display_sort > 0` olan ürünler **artan sıraya göre en üstte** (1, 2, 3, ...)
- `display_sort = 0` ya da satırı yok olanlar **alfabetik sıraya göre** sonra

Yani admin ilk 10 ürünü 1..10 olarak sıraladığında, frontend onları o sırayla en üstte gösterir; geri kalan 80 ürün alfabetik kalır.

### Admin sekmesi — yapılacak

Halk Günü admin sekmesine **"Ürün Sırası"** alt sekmesi ekle. UX:

1. **Etkinlik seçici** (mevcut event picker'dan miras)
2. **Ürün listesi (drag handle ile)**
   - Mevcut event için `halkgunu_products`'tan distinct `urun_kod, urun_ad` çek
   - Mevcut `halkgunu_product_order` ile birleştir → ilk olarak sıralı olanlar (display_sort artan), sonra alfabetik
   - Her satır: drag handle ikonu + ürün resmi (küçük) + urun_kod + urun_ad + display_sort numarası (input ya da otomatik)
3. **Drag-drop reorder**
   - Streamlit'te native drag-drop yok. İki seçenek:
     - **A.** `streamlit-sortables` veya `streamlit-elements` paketi (PyPI'da mevcut, Ara'nın requirements.txt'sine ekleyebilirsin)
     - **B.** Manuel: her satırda ↑↓ butonlar (basit, kütüphane gerektirmez)
   - Önerim **B** (kütüphane çatışması ve maintenance riski yok). Drag UX'inden gerçek getiri yok 50 üründe; ↑↓ yeterli.
4. **"Sıralamayı kaydet"** butonu
   - Tek bir UPSERT batch:
     ```python
     rows = [
       {"event_id": eid, "urun_kod": k, "display_sort": i + 1}
       for i, k in enumerate(reordered_kods)
       if i < limit  # sadece elle sıralananlar (örn. ilk 30) sıralı kaydedilir
     ]
     # geri kalanlara display_sort = 0 yaz (varsayılan alfabetik sıraya bırak)
     supabase.table("halkgunu_product_order").upsert(rows, on_conflict="event_id,urun_kod").execute()
     ```
5. **"Sıralamayı temizle"** butonu — opsiyonel
   - Bu event için tüm `halkgunu_product_order` satırlarını sil:
     ```python
     supabase.table("halkgunu_product_order").delete().eq("event_id", eid).execute()
     ```

### Kabul kriterleri (sıralama)

- [ ] Admin → Halk Günü → "Ürün Sırası" alt sekmesi açılıyor
- [ ] Aktif etkinlik için ürün listesi geliyor, sırada olanlar üstte
- [ ] ↑↓ ile (veya drag ile) sıra değişiyor, "Kaydet" → DB'ye yazıyor
- [ ] Halkgunu.net refresh → liste modunda sırayı görüyorsun: önce sıralı ürünler, sonra alfabetik
- [ ] "Temizle" → tüm sıralama silinir, frontend alfabetik döner

---

## 7.4 İsteğe bağlı — Etkinlik bazında varsayılan sıralama

Frontend default sort'u `"oneri"` (= API'den gelen sırayı koru, manuel
order varsa onu, yoksa alfabetik). Admin manuel reorder yaparsa
müşteri otomatik o sırayı görür.

Admin **algoritmik bir default** (örn. "her zaman en çok indirim öncelikli")
seçmek isterse `halkgunu_events` tablosuna kolon ekleyebilirsin:

```sql
ALTER TABLE halkgunu_events
  ADD COLUMN default_sort TEXT DEFAULT 'oneri'
  CHECK (default_sort IN ('oneri','indirim','fiyat_artan','fiyat_azalan','stok'));
```

Bu eklenirse:
- Admin event düzenleme formunda dropdown ile seçer
- Frontend `listActiveEvents` ile birlikte alır, ListView default sort'u
  buradan ister (bugün hardcoded `"oneri"`, kolaylıkla event prop'undan
  alınabilir)

İhtiyaç netleşmediği için **şimdilik eklenmedi**; kullanıcı isterse bu
SQL'i çalıştırır + frontend'de küçük bir prop pass-through yaparız.

---

## 7.5 Bilinen sorun — Excel re-upload dedup'ı

Kullanıcı belirtti: bir afişte 15 ürün birlikte yer alıyor, sonra **aynı 15 ürün tek-tek** ayrı afiş sayfalarında da gösteriliyor. Aynı Excel'i ikinci kez yüklediğinde admin "bu ürün event'te zaten var" diye yeni mapping kaydını yok sayıyormuş.

**Frontend kontratı bu konuda nettir:**

| Tablo | Aynı `urun_kod` için duplicate satır olabilir mi? |
|---|---|
| `halkgunu_products` | **Hayır** — `UNIQUE (event_id, urun_kod, magaza_kod)`. Excel re-upload `ON CONFLICT DO UPDATE` ile güncellenmeli (fiyat). |
| `halkgunu_mappings` | **Evet** — aynı ürün farklı `(flyer_filename, page_no, bbox)` üzerinde birden fazla satıra sahip olabilir, **olmalı**. Dedup yapılmamalı. |

`halkgunu_mappings` Excel ile değil, afiş upload sırasında OCR/manual mapping akışıyla doluyor. Excel re-upload sırasında mappings'e dokunulmamalı.

**Yapılacak:** Ara'nın Excel import handler'ında dedup mantığı:
- `halkgunu_products`'a yazarken `(event_id, urun_kod, magaza_kod)` UPSERT — ✓ doğru olan bu
- `halkgunu_mappings`'e Excel'den **hiç dokunma** — onun kendi flow'u var
- Eğer admin "bu ürün event'te zaten var, atla" diyorsa, bu sadece products satırı için olmalı, mapping eklemeyi engellememeli

Kullanıcıyla doğrula: dedup tam olarak neyi engelliyor? Bu satır mı, mapping mi, yoksa yeni Excel satırlarındaki fiyat güncellemesi mi atlanıyor?

---

## 8. Bittiğinde

Ara'nın `claude/halkgunu` (veya hangi branch'tey­sen) üzerine commit + push. Halkgunu repo'suna dokunma (frontend tamam). PR açacaksan kullanıcıya sor.

İyi iş.
