import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const retrySync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("is_order_staff", { _user_id: context.userId });
    if (!allowed) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { dispatchOutbox, n8nConfigured } = await import("./sync.server");
    if (!n8nConfigured()) return { ok: false, message: "ربط n8n لسه مش متضبط (N8N_WEBHOOK_URL / N8N_WEBHOOK_TOKEN)." };
    if (data.orderId) {
      await supabaseAdmin.from("order_outbox").insert({ order_id: data.orderId });
      await supabaseAdmin.from("orders").update({ sync_status: "Pending" }).eq("id", data.orderId);
    } else {
      await supabaseAdmin.from("order_outbox").update({ next_attempt_at: new Date().toISOString(), attempts: 0 })
        .eq("status", "failed");
    }
    const r = await dispatchOutbox(supabaseAdmin, 6);
    return { ok: true, message: `تمت المعالجة: ${r.processed}، نجح: ${"sent" in r ? r.sent : 0}، فشل: ${"failed" in r ? r.failed : 0}` };
  });

export const getIntegrationState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed } = await context.supabase.rpc("is_order_staff", { _user_id: context.userId });
    if (!allowed) throw new Error("Forbidden");
    const { n8nConfigured } = await import("./sync.server");
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: rows } = await context.supabase.from("integration_status").select("*");
    return {
      isAdmin: !!isAdmin,
      n8nSecretsPresent: n8nConfigured(),
      status: rows ?? [],
    };
  });

export const getN8nWorkflow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const mod = await import("../../docs/n8n-orders-to-sheets.workflow.json?raw");
    return { json: mod.default as string };
  });
