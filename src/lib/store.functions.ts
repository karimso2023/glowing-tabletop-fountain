import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { orderInputSchema } from "./order-schema";

export type PublicConfig = {
  productName: string;
  unitPrice: number | null;
  compareAtPrice: number | null;
  shippingRates: Record<string, number> | null;
  flatShippingFee: number | null;
  storeName: string | null;
  maxQuantity: number;
  orderable: boolean;
};

export const getStoreConfig = createServerFn({ method: "GET" }).handler(async (): Promise<PublicConfig> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await sb.from("store_config").select("*").eq("id", 1).single();
  if (error || !data) throw new Error("config unavailable");
  const rates = data.shipping_rates as Record<string, number> | null;
  const unit = data.unit_price == null ? null : Number(data.unit_price);
  const compare = data.compare_at_price == null ? null : Number(data.compare_at_price);
  return {
    productName: data.product_name,
    unitPrice: unit,
    compareAtPrice: compare && unit && compare > unit ? compare : null,
    shippingRates: rates && Object.keys(rates).length ? rates : null,
    flatShippingFee: data.flat_shipping_fee == null ? null : Number(data.flat_shipping_fee),
    storeName: data.store_name,
    maxQuantity: data.max_quantity,
    orderable: unit != null && ((!!rates && Object.keys(rates).length > 0) || data.flat_shipping_fee != null),
  };
});

async function recordAttribution(orderNumber: string, data: { analyticsConsent: boolean; utm: Record<string, string | undefined> }) {
  const srv = await import("./analytics.server");
  const { cleanUtm } = await import("./analytics-core");
  const client = srv.getTrustedClient();
  const tokenHash = data.analyticsConsent ? await srv.currentTokenHash() : null;
  const utm = cleanUtm(data.utm);
  const n = null as unknown as string;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("record_order_attribution", {
    p_order_number: orderNumber, p_token_hash: tokenHash ?? n, p_consent: data.analyticsConsent,
    p_ip: client.ip ?? n, p_country: client.country ?? n, p_region: client.region ?? n, p_city: client.city ?? n,
    p_utm_source: utm.source ?? n, p_utm_medium: utm.medium ?? n, p_utm_campaign: utm.campaign ?? n, p_utm_content: utm.content ?? n,
  });
  if (error) console.error("record_order_attribution failed");
}

const ERR: Record<string, string> = {
  not_configured: "الطلب مش متاح حاليًا لحد ما يتم تحديد السعر ومصاريف الشحن.",
  governorate_unavailable: "للأسف الشحن لمحافظتك مش متاح حاليًا.",
  bad_quantity: "الكمية المطلوبة غير متاحة.",
  rate_limited: "تم استلام طلبات كتير من نفس الرقم أو الجهاز. لو محتاج مساعدة تواصل معانا.",
};

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderInputSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: false as const, message: "تعذر إرسال الطلب." };
    const elapsed = Date.now() - data.startedAt;
    if (elapsed < 3000) return { ok: false as const, message: "استنى ثانية وجرب تاني." };

    // IP only from trusted edge ingress (same source as analytics); null otherwise, phone limits still apply.
    const srvA = await import("./analytics.server");
    const trustedIp = srvA.getTrustedClient().ip;
    const ipHash: string | null = trustedIp ? await srvA.sha256Hex(`mya-order:${trustedIp}`) : null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.rpc("create_cod_order", {
      p_idempotency_key: data.idempotencyKey,
      p_ip_hash: ipHash as string,
      p_name: data.name,
      p_phone: data.phone,
      p_governorate: data.governorate,
      p_city: data.city,
      p_address: data.address,
      p_quantity: data.quantity,
      p_notes: data.notes || (null as unknown as string),
      p_utm_source: data.utm.source ?? (null as unknown as string),
      p_utm_medium: data.utm.medium ?? (null as unknown as string),
      p_utm_campaign: data.utm.campaign ?? (null as unknown as string),
      p_utm_content: data.utm.content ?? (null as unknown as string),
    });
    if (error) {
      console.error("create_cod_order failed", error.message);
      return { ok: false as const, message: "حصلت مشكلة في تسجيل الطلب. بياناتك لسه موجودة، جرب تاني." };
    }
    const r = res as { ok: boolean; error?: string; order_number?: string; total_price?: number; duplicate?: boolean };
    if (!r.ok) return { ok: false as const, message: ERR[r.error ?? ""] ?? "تعذر تسجيل الطلب." };

    // Admin-only attribution snapshot. Strictly best-effort: never blocks or fails the order.
    try {
      await Promise.race([recordAttribution(r.order_number!, data), new Promise((res) => setTimeout(res, 1500))]);
    } catch {
      console.error("order attribution skipped");
    }

    // Best-effort immediate sync; the outbox + scheduled dispatcher guarantee eventual delivery.
    if (!r.duplicate) {
      try {
        const { dispatchOutbox } = await import("./sync.server");
        await Promise.race([dispatchOutbox(supabaseAdmin, 3), new Promise((res) => setTimeout(res, 4000))]);
        const { dispatchNotifications } = await import("./notify.server");
        await Promise.race([dispatchNotifications(supabaseAdmin, 2), new Promise((res) => setTimeout(res, 3000))]);
      } catch (e) {
        console.error("inline dispatch failed", e);
      }
    }
    return { ok: true as const, orderNumber: r.order_number!, total: Number(r.total_price), duplicate: !!r.duplicate };
  });
