// Pure helpers for new-order Telegram notifications (no IP, address, phone or name by design).
export const ADMIN_URL = "https://glowing-tabletop-fountain.lovable.app/admin";

export function buildOrderMessage(o: { order_number: string; quantity: number; total_price: number | string; governorate: string }) {
  const total = new Intl.NumberFormat("en-US").format(Number(o.total_price));
  return [
    "🛒 طلب جديد – Dutti",
    `رقم الطلب: ${o.order_number}`,
    `الكمية: ${o.quantity}`,
    `الإجمالي: ${total} ج.م`,
    `المحافظة: ${o.governorate}`,
    "الدفع: عند الاستلام",
    `لوحة الطلبات: ${ADMIN_URL}`,
  ].join("\n");
}

// Only a production webhook path on the store's n8n instance, distinct from the Sheets webhook.
export function isAllowedNotifyUrl(u: string | undefined) {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname === "n8n.dutti.net" && /^\/webhook\/[^/]+/.test(x.pathname);
  } catch { return false; }
}

export function notifyBackoffMinutes(attempts: number) {
  return Math.min(2 ** attempts, 360);
}
