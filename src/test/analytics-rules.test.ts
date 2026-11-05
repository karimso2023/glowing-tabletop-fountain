import { describe, expect, it } from "vitest";
import { cairoDay, cleanUtm, isBotUserAgent, isValidToken, normalizeIp, safeReferrer } from "@/lib/analytics-core";

describe("IP parsing", () => {
  it("accepts IPv4", () => expect(normalizeIp("41.33.12.7")).toBe("41.33.12.7"));
  it("accepts IPv6", () => expect(normalizeIp("2C0F:FC88::1")).toBe("2c0f:fc88::1"));
  it("rejects forwarded lists (spoof style)", () => expect(normalizeIp("1.2.3.4, 5.6.7.8")).toBeNull());
  it("rejects garbage", () => expect(normalizeIp("<script>")).toBeNull());
  it("rejects out-of-range octets", () => expect(normalizeIp("999.1.1.1")).toBeNull());
});

describe("referrer / utm whitelist", () => {
  it("keeps only host and path, drops query", () =>
    expect(safeReferrer("https://m.facebook.com/l.php?u=x&phone=010", "dutti.net")).toEqual({ host: "m.facebook.com", path: "/l.php" }));
  it("drops own-site referrer", () => expect(safeReferrer("https://dutti.net/x", "dutti.net").host).toBeNull());
  it("drops non-http schemes", () => expect(safeReferrer("javascript:alert(1)", null).host).toBeNull());
  it("keeps only the 4 utm keys and caps length", () => {
    const r = cleanUtm({ source: "fb", phone: "01012345678", campaign: "x".repeat(400) } as never);
    expect(Object.keys(r).sort()).toEqual(["campaign", "source"]);
    expect(r.campaign).toHaveLength(150);
  });
});

describe("sessions & bots", () => {
  it("token must be 32 random bytes base64url", () => {
    expect(isValidToken("a".repeat(43))).toBe(true);
    expect(isValidToken("6f1c2b0e-8f7a-4a7b-9b7e-1d2c3b4a5f60")).toBe(false);
  });
  it("flags headless/crawler user agents", () => {
    expect(isBotUserAgent("Mozilla/5.0 HeadlessChrome/120")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile Safari/537.36")).toBe(false);
  });
});

describe("Cairo day boundaries", () => {
  it("22:30 UTC on Nov 4 is already Nov 5 in Cairo (UTC+2)", () =>
    expect(cairoDay(new Date("2026-11-04T22:30:00Z"))).toBe("2026-11-05"));
  it("21:59 UTC on Nov 4 is still Nov 4 in Cairo", () =>
    expect(cairoDay(new Date("2026-11-04T21:59:00Z"))).toBe("2026-11-04"));
});
