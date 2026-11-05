// Pure helpers for visitor analytics (no I/O) — shared by server code and tests.

export const ANALYTICS_COOKIE = "dutti_as";
export const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pagespeed|curl|wget|python|httpclient|axios|node-fetch|phantom|selenium|puppeteer|playwright/i;
export function isBotUserAgent(ua: string | undefined | null) {
  return !ua || ua.length < 20 || BOT_RE.test(ua);
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:.]{2,45}$/i;
/** Accepts a single IPv4/IPv6 literal (no lists, ports or zone ids). */
export function normalizeIp(v: string | undefined | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (IPV4.test(s)) return s;
  if (s.includes(":") && IPV6.test(s) && (s.match(/::/g)?.length ?? 0) <= 1) return s.toLowerCase();
  return null;
}

/** Referrer reduced to host + path (no query/fragment/credentials). Own-site referrers dropped. */
export function safeReferrer(ref: string | undefined | null, ownHost: string | undefined | null) {
  if (!ref) return { host: null, path: null };
  try {
    const u = new URL(ref);
    if (u.protocol !== "https:" && u.protocol !== "http:") return { host: null, path: null };
    const host = u.hostname.toLowerCase().slice(0, 253);
    if (ownHost && host === ownHost.toLowerCase()) return { host: null, path: null };
    const path = u.pathname.replace(/[^\w\-./~%]/g, "").slice(0, 200) || "/";
    return { host, path };
  } catch {
    return { host: null, path: null };
  }
}

const UTM_LIMITS = { source: 100, medium: 100, campaign: 150, content: 150 } as const;
/** UTM whitelist: only the four known keys, printable chars, bounded length. */
export function cleanUtm(u: Partial<Record<string, unknown>> | undefined) {
  const out: { source?: string; medium?: string; campaign?: string; content?: string } = {};
  for (const k of Object.keys(UTM_LIMITS) as (keyof typeof UTM_LIMITS)[]) {
    const v = u?.[k];
    if (typeof v !== "string") continue;
    const c = v.replace(/[\u0000-\u001f<>"'`]/g, "").trim().slice(0, UTM_LIMITS[k]);
    if (c) out[k] = c;
  }
  return out;
}

export function cleanPath(p: string | undefined | null) {
  if (!p || !p.startsWith("/")) return "/";
  return p.split(/[?#]/)[0]!.replace(/[^\w\-./~%]/g, "").slice(0, 200) || "/";
}

export function isValidToken(t: string | undefined | null): t is string {
  return !!t && /^[A-Za-z0-9_-]{43}$/.test(t);
}

/** Cairo calendar date (YYYY-MM-DD) for an instant. */
export function cairoDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
