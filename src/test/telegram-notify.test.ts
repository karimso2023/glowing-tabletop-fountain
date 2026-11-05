import { describe, expect, it } from "vitest";
import { buildOrderMessage, isAllowedNotifyUrl } from "@/lib/notify-core";

describe("telegram order message", () => {
  const msg = buildOrderMessage({ order_number: "MYA-261105-2000", quantity: 1, total_price: "830", governorate: "القاهرة" });
  it("includes order id, quantity, total, governorate and COD", () => {
    expect(msg).toContain("MYA-261105-2000");
    expect(msg).toContain("الكمية: 1");
    expect(msg).toContain("830 ج.م");
    expect(msg).toContain("القاهرة");
    expect(msg).toContain("عند الاستلام");
  });
  it("only allows production webhooks on n8n.dutti.net", () => {
    expect(isAllowedNotifyUrl("https://n8n.dutti.net/webhook/dutti-telegram-notify")).toBe(true);
    expect(isAllowedNotifyUrl("https://n8n.dutti.net/webhook-test/x")).toBe(false);
    expect(isAllowedNotifyUrl("https://api.telegram.org/bot/x")).toBe(false);
  });
});
