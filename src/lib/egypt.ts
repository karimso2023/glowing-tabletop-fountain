export const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "الغربية", "المنوفية",
  "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "الفيوم", "بني سويف",
  "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد",
  "مطروح", "شمال سيناء", "جنوب سيناء",
] as const;

const DIGIT_MAP: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d);
}

/** Returns a normalized Egyptian mobile (01XXXXXXXXX) or null when invalid. */
export function normalizeEgyptianMobile(raw: string): string | null {
  let v = toLatinDigits(raw).replace(/[\s\-()]/g, "");
  if (v.startsWith("+20")) v = "0" + v.slice(3);
  else if (v.startsWith("0020")) v = "0" + v.slice(4);
  else if (v.startsWith("20") && v.length === 12) v = "0" + v.slice(2);
  return /^01[0125]\d{8}$/.test(v) ? v : null;
}

export function formatEGP(n: number): string {
  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n)} ج.م`;
}
