import { describe, expect, it } from "vitest";
import { shippingFor } from "@/components/store/Checkout";
import type { PublicConfig } from "@/lib/store.functions";

const cfg: PublicConfig = {
  productName: "نافورة ميا LED صغيرة", unitPrice: 750, compareAtPrice: 800, shippingRates: null,
  flatShippingFee: 80, storeName: "Dutti", maxQuantity: 5, orderable: true,
};

describe("pricing", () => {
  it("flat 80 shipping applies to any governorate", () => expect(shippingFor(cfg, "أسوان")).toBe(80));
  it("quantity 1 total is 830", () => expect(cfg.unitPrice! * 1 + shippingFor(cfg, "القاهرة")!).toBe(830));
  it("shipping is per order, not per piece (qty 2 = 1580)", () => expect(cfg.unitPrice! * 2 + shippingFor(cfg, "القاهرة")!).toBe(1580));
  it("saving is 50 EGP (6.25%)", () => {
    expect(cfg.compareAtPrice! - cfg.unitPrice!).toBe(50);
    expect(((cfg.compareAtPrice! - cfg.unitPrice!) / cfg.compareAtPrice!) * 100).toBe(6.25);
  });
});
