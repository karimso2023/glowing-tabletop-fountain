// Server-only: dispatches order outbox rows to the n8n webhook (which writes Google Sheets).
type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

function cairoDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date(iso)).replace(",", "");
}

// Only production webhook paths on the store's n8n instance may receive order data.
export function isAllowedWebhookUrl(u: string | undefined) {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname === "n8n.dutti.net" && /^\/webhook\/[^/]+/.test(x.pathname);
  } catch { return false; }
}

export function n8nConfigured() {
  return Boolean(isAllowedWebhookUrl(process.env["N8N_WEBHOOK_URL"]) && process.env["N8N_WEBHOOK_TOKEN"]);
}

export async function dispatchOutbox(admin: Admin, limit = 6) {
  const url = process.env["N8N_WEBHOOK_URL"];
  const token = process.env["N8N_WEBHOOK_TOKEN"];
  if (!isAllowedWebhookUrl(url) || !token) return { skipped: "n8n_not_configured", processed: 0 };

  const { data: rows, error } = await admin.rpc("claim_outbox", { p_limit: limit });
  if (error) throw new Error(`claim_outbox failed: ${error.message}`);
  let sent = 0, failed = 0;

  for (const row of rows ?? []) {
    const { data: o } = await admin.from("orders").select("*").eq("id", row.order_id).single();
    if (!o) continue;
    const payload = {
      "Order ID": o.order_number,
      "Order Date": cairoDate(o.created_at),
      "Customer Name": o.customer_name,
      "Phone Number": o.phone,
      "Governorate": o.governorate,
      "City": o.city,
      "Full Address": o.full_address,
      "Product Name": o.product_name,
      "Product Color": o.selected_color ?? "",
      "Product Size": o.selected_size ?? "",
      "Quantity": o.quantity,
      "Unit Price": Number(o.unit_price),
      "Shipping Fee": Number(o.shipping_fee),
      "Discount": Number(o.discount_amount),
      "Total Price": Number(o.total_price),
      "Payment Method": o.payment_method,
      "Order Status": o.order_status,
      "Customer Notes": o.customer_notes ?? "",
      "UTM Source": o.utm_source ?? "",
      "UTM Campaign": o.utm_campaign ?? "",
      "Sync Status": "Synced",
    };
    let ok = false, errText = "";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Webhook-Token": token },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      const body = await res.text();
      ok = res.ok && /"ok"\s*:\s*true/.test(body);
      if (!ok) errText = `HTTP ${res.status}: ${body.slice(0, 300)}`;
    } catch (e) {
      errText = e instanceof Error ? e.message : String(e);
    }
    const now = new Date().toISOString();
    if (ok) {
      sent++;
      await admin.from("order_outbox").update({ status: "sent", sent_at: now, last_error: null, locked_until: null }).eq("id", row.id);
      // Only mark Synced if no newer pending event exists for this order.
      const { count } = await admin.from("order_outbox").select("id", { count: "exact", head: true })
        .eq("order_id", o.id).in("status", ["pending", "processing", "failed"]);
      if (!count) await admin.from("orders").update({ sync_status: "Synced" }).eq("id", o.id);
      await admin.from("integration_status").upsert({ key: "n8n_sheets", verified_at: now, last_checked_at: now, detail: `Order ${o.order_number} accepted by n8n` });
    } else {
      failed++;
      const backoffMin = Math.min(2 ** row.attempts, 360);
      await admin.from("order_outbox").update({
        status: "failed", last_error: errText, locked_until: null,
        next_attempt_at: new Date(Date.now() + backoffMin * 60000).toISOString(),
      }).eq("id", row.id);
      await admin.from("orders").update({ sync_status: "Failed" }).eq("id", o.id);
      await admin.from("integration_status").upsert({ key: "n8n_sheets_last_error", last_checked_at: now, detail: errText });
    }
  }
  return { processed: rows?.length ?? 0, sent, failed };
}
