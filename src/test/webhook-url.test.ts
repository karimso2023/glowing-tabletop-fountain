import { describe, it, expect } from "vitest";
import { isAllowedWebhookUrl } from "@/lib/sync.server";
describe("n8n webhook url guard", () => {
  it("accepts production webhook", () => expect(isAllowedWebhookUrl("https://n8n.dutti.net/webhook/mya-orders")).toBe(true));
  it("rejects root instance url", () => expect(isAllowedWebhookUrl("https://n8n.dutti.net/")).toBe(false));
  it("rejects test webhook", () => expect(isAllowedWebhookUrl("https://n8n.dutti.net/webhook-test/mya-orders")).toBe(false));
  it("rejects other hosts and http", () => {
    expect(isAllowedWebhookUrl("https://evil.example/webhook/x")).toBe(false);
    expect(isAllowedWebhookUrl("http://n8n.dutti.net/webhook/x")).toBe(false);
  });
});
