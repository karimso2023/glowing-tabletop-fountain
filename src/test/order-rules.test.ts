import { describe, expect, it } from "vitest";
import { normalizeEgyptianMobile } from "@/lib/egypt";
import { orderInputSchema } from "@/lib/order-schema";

describe("Egyptian mobile", () => {
  it("accepts Arabic-Indic digits", () => expect(normalizeEgyptianMobile("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678"));
  it("normalizes +20 prefix", () => expect(normalizeEgyptianMobile("+20 112 345 6789")).toBe("01123456789"));
  it("rejects landline / wrong prefix", () => expect(normalizeEgyptianMobile("0131234567")).toBeNull());
  it("rejects 013 operator prefix", () => expect(normalizeEgyptianMobile("01312345678")).toBeNull());
});

const base = {
  idempotencyKey: "6f1c2b0e-8f7a-4a7b-9b7e-1d2c3b4a5f60", name: "أحمد محمد", phone: "01012345678",
  governorate: "القاهرة", city: "مدينة نصر", address: "١٢ شارع عباس العقاد الدور ٣", quantity: 1, startedAt: 1,
};

describe("order input", () => {
  it("accepts a valid order", () => expect(orderInputSchema.safeParse(base).success).toBe(true));
  it("rejects unknown governorate", () => expect(orderInputSchema.safeParse({ ...base, governorate: "Paris" }).success).toBe(false));
  it("rejects quantity 0", () => expect(orderInputSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false));
  it("rejects filled honeypot", () => expect(orderInputSchema.safeParse({ ...base, website: "x" }).success).toBe(false));
  it("does not accept client prices", () => {
    const r = orderInputSchema.parse({ ...base, total: 1, unitPrice: 1 } as never);
    expect("total" in r).toBe(false);
  });
});
