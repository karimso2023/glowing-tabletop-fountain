import { describe, it, expect, vi, beforeEach } from "vitest";

const headers: Record<string, string> = {};
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: (k: string) => headers[k.toLowerCase()],
  getCookie: () => undefined,
}));

import { getTrustedClient } from "@/lib/analytics.server";

describe("trusted client IP (order rate limit + analytics)", () => {
  beforeEach(() => {
    for (const k of Object.keys(headers)) delete headers[k];
    (globalThis as { __duttiIngressNonce?: string }).__duttiIngressNonce = "real-nonce";
  });

  it("ignores spoofed x-forwarded-for / cf-connecting-ip / forged x-dutti headers", () => {
    Object.assign(headers, {
      "x-forwarded-for": "6.6.6.6",
      "cf-connecting-ip": "7.7.7.7",
      "x-dutti-ingress": "guessed",
      "x-dutti-client-ip": "8.8.8.8",
    });
    expect(getTrustedClient().ip).toBeNull();
  });

  it("accepts the IP only with the edge nonce", () => {
    Object.assign(headers, { "x-dutti-ingress": "real-nonce", "x-dutti-client-ip": "2001:db8::1" });
    expect(getTrustedClient().ip).toBe("2001:db8::1");
  });
});
