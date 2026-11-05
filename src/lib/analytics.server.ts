// Server-only: trusted client metadata + session token handling.
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { ANALYTICS_COOKIE, isValidToken, normalizeIp } from "./analytics-core";

export type TrustedClient = { ip: string | null; country: string | null; region: string | null; city: string | null };

/** Only values injected by src/server.ts at the Cloudflare edge are trusted (nonce-checked). */
export function getTrustedClient(): TrustedClient {
  const nonce = (globalThis as unknown as { __duttiIngressNonce?: string }).__duttiIngressNonce;
  const marker = getRequestHeader("x-dutti-ingress" as never);
  if (!nonce || marker !== nonce) return { ip: null, country: null, region: null, city: null };
  const dec = (k: string) => {
    const v = getRequestHeader(k as never);
    if (!v) return null;
    try { return decodeURIComponent(v).slice(0, 120); } catch { return null; }
  };
  return {
    ip: normalizeIp(getRequestHeader("x-dutti-client-ip" as never)),
    country: dec("x-dutti-geo-country"),
    region: dec("x-dutti-geo-region"),
    city: dec("x-dutti-geo-city"),
  };
}

export async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function newToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function currentTokenHash(): Promise<string | null> {
  const t = getCookie(ANALYTICS_COOKIE);
  return isValidToken(t) ? sha256Hex(`dutti-as:${t}`) : null;
}
