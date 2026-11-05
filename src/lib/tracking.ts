// Marketing tracking adapter. No pixel/tag IDs are configured yet, so every call is a no-op.
// When IDs are supplied, load the provider tags here behind the consent decision (see docs/SETUP.md).
// Never pass customer name, phone or address to these events.
type EventName = "PageView" | "ViewContent" | "InitiateCheckout" | "Lead";

const META_PIXEL_ID = import.meta.env["VITE_META_PIXEL_ID"] as string | undefined;
const GA4_ID = import.meta.env["VITE_GA4_ID"] as string | undefined;

export const trackingEnabled = Boolean(META_PIXEL_ID || GA4_ID);

export function track(event: EventName, params?: { value?: number; currency?: "EGP"; eventId?: string }) {
  if (!trackingEnabled || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("store:track", { detail: { event, params } }));
}

/** Registered COD order. Deduplicated per order number in this browser. */
export function trackOrderRegistered(orderNumber: string, value: number) {
  if (!trackingEnabled || typeof window === "undefined") return;
  const key = `tracked:${orderNumber}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  track("Lead", { value, currency: "EGP", eventId: orderNumber });
}

export function readUtm() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const stored = JSON.parse(sessionStorage.getItem("utm") ?? "{}") as Record<string, string>;
  const utm = {
    source: p.get("utm_source") ?? stored["source"],
    medium: p.get("utm_medium") ?? stored["medium"],
    campaign: p.get("utm_campaign") ?? stored["campaign"],
    content: p.get("utm_content") ?? stored["content"],
  };
  sessionStorage.setItem("utm", JSON.stringify(utm));
  return Object.fromEntries(Object.entries(utm).filter(([, v]) => v)) as Record<string, string>;
}
