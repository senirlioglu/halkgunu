// Ürün kodunun ilk 2 hanesi kategori belirtir (Ara'daki "Ürün grubu2" kolonu).
// urun_kod sayısal değilse veya prefix tabloya yoksa null döner.

export const CATEGORIES: Record<string, string> = {
  "11": "Et ve Etli Mamüller",
  "12": "Süt ve Sütlü Mamüller",
  "13": "Sıvı İçecekler ve Cips",
  "14": "Bakliyat ve Kuru Gıdalar",
  "15": "Kuruyemişler",
  "16": "Kahvaltılıklar",
  "17": "Bisküvi, Kek ve Mamalar",
  "18": "Konserve ve Baharatlar",
  "19": "Katı ve Sıvı Yağlar",
  "20": "Meyve ve Sebzeler",
  "21": "Dondurma ve Dondurulmuş Ürünler",
  "22": "Deterjan ve Temizlik",
  "23": "Kağıt Ürünleri",
  "24": "Kozmetik",
  "25": "Gıda Dışı",
  "26": "Spot",
  "27": "Çikolata ve Şekerlemeler",
  "28": "Un ve Unlu Mamuller",
  "30": "Çay, Kahve ve Toz İçecekler",
};

const EMOJI: Record<string, string> = {
  "11": "🥩",
  "12": "🥛",
  "13": "🥤",
  "14": "🌾",
  "15": "🥜",
  "16": "🍯",
  "17": "🍪",
  "18": "🥫",
  "19": "🫒",
  "20": "🍅",
  "21": "🍦",
  "22": "🧴",
  "23": "🧻",
  "24": "💄",
  "25": "📦",
  "26": "⭐",
  "27": "🍫",
  "28": "🥖",
  "30": "☕",
};

export function prefixOf(kod: string): string {
  const digits = kod.replace(/[^0-9]/g, "");
  return digits.slice(0, 2);
}

export function categoryOf(kod: string): string | null {
  return CATEGORIES[prefixOf(kod)] ?? null;
}

export function emojiFor(kod: string): string {
  return EMOJI[prefixOf(kod)] ?? "📦";
}
