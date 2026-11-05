// Browser side of visitor analytics. Runs only after explicit consent; sends no
// names/phones/addresses. Counts and IP/geo are decided on the server.
import { trackVisit, analyticsOptOut } from "./analytics.functions";
import { readUtm } from "./tracking";

export type Consent = "granted" | "denied" | null;
const KEY = "dutti_analytics_consent";
const HEARTBEAT_MS = 30_000;

export function getConsent(): Consent {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "granted" || v === "denied" ? v : null;
}

let pageviewId = "";
let timer: ReturnType<typeof setInterval> | undefined;
let checkoutSent = false;

function send(kind: "pageview" | "heartbeat" | "checkout_start") {
  if (getConsent() !== "granted") return;
  const ctl = Promise.race([
    trackVisit({ data: { kind, pageviewId, referrer: document.referrer, path: location.pathname, utm: readUtm() } }),
    new Promise((r) => setTimeout(r, 5000)),
  ]);
  ctl.catch(() => undefined);
}

function onVisibility() {
  if (document.visibilityState === "visible") send("heartbeat");
}

export function startAnalytics() {
  if (getConsent() !== "granted" || timer) return;
  pageviewId = crypto.randomUUID();
  send("pageview");
  // Heartbeat only while this tab is visible; tabs share one session cookie, so the server counts them once.
  timer = setInterval(() => { if (document.visibilityState === "visible") send("heartbeat"); }, HEARTBEAT_MS);
  document.addEventListener("visibilitychange", onVisibility);
}

export function stopAnalytics() {
  if (timer) clearInterval(timer);
  timer = undefined;
  document.removeEventListener("visibilitychange", onVisibility);
}

export function setConsent(v: "granted" | "denied") {
  localStorage.setItem(KEY, v);
  window.dispatchEvent(new CustomEvent("dutti:consent", { detail: v }));
  if (v === "granted") startAnalytics();
  else { stopAnalytics(); analyticsOptOut().catch(() => undefined); }
}

export function trackCheckoutStart() {
  if (checkoutSent) return;
  checkoutSent = true;
  send("checkout_start");
}
