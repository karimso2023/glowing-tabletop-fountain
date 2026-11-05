// Server-only: sends new-order Telegram alerts via a separate n8n webhook.
// State lives in order_notifications, independent of the Sheets outbox: failures here never touch orders/outbox.
import { buildOrderMessage, isAllowedNotifyUrl, notifyBackoffMinutes } from "./notify-core";
type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export function telegramNotifyConfigured() {
  return Boolean(isAllowedNotifyUrl(process.env["TELEGRAM_NOTIFY_URL"]) && process.env["N8N_WEBHOOK_TOKEN"]);
}

// Called once the order's sheet row is verified. Disabled (no-op) until the destination is configured,
// so orders placed before enabling never trigger a backlog of alerts.
export async function enqueueOrderNotification(admin: Admin, orderId: string) {
  if (!telegramNotifyConfigured()) return false;
  const { data, error } = await admin.rpc("enqueue_order_notification", { p_order_id: orderId });
  if (error) { console.error("enqueue notification failed"); return false; }
  return !!data;
}

export async function dispatchNotifications(admin: Admin, limit = 5) {
  const url = process.env["TELEGRAM_NOTIFY_URL"];
  const token = process.env["N8N_WEBHOOK_TOKEN"];
  if (!url || !isAllowedNotifyUrl(url) || !token) return { skipped: "telegram_not_configured", processed: 0 };
  const { data: rows, error } = await admin.rpc("claim_order_notifications", { p_limit: limit });
  if (error) throw new Error(`claim_order_notifications failed: ${error.message}`);
  let sent = 0, failed = 0;
  for (const row of rows ?? []) {
    const { data: o } = await admin.from("orders").select("order_number,quantity,total_price,governorate").eq("id", row.order_id).single();
    if (!o) continue;
    let messageId: number | null = null, errText = "";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Webhook-Token": token },
        body: JSON.stringify({ "Order ID": o.order_number, text: buildOrderMessage(o) }),
        signal: AbortSignal.timeout(15000),
      });
      const body = await res.text();
      const m = /"message_id"\s*:\s*(\d+)/.exec(body);
      if (res.ok && /"ok"\s*:\s*true/.test(body) && m) messageId = Number(m[1]);
      else errText = `HTTP ${res.status}: ${body.slice(0, 300)}`;
    } catch (e) { errText = e instanceof Error ? e.message : String(e); }
    const now = new Date().toISOString();
    if (messageId != null) {
      sent++;
      await admin.from("order_notifications").update({ status: "sent", sent_at: now, message_id: messageId, last_error: null, locked_until: null }).eq("order_id", row.order_id);
    } else {
      failed++;
      await admin.from("order_notifications").update({
        status: "failed", last_error: errText, locked_until: null,
        next_attempt_at: new Date(Date.now() + notifyBackoffMinutes(row.attempts) * 60000).toISOString(),
      }).eq("order_id", row.order_id);
    }
  }
  return { processed: rows?.length ?? 0, sent, failed };
}
