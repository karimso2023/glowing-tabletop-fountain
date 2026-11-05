import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/outbox-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { dispatchOutbox } = await import("@/lib/sync.server");
        const result = await dispatchOutbox(supabaseAdmin, 6);
        let notifications: unknown = null;
        try {
          const { dispatchNotifications } = await import("@/lib/notify.server");
          notifications = await dispatchNotifications(supabaseAdmin, 10);
        } catch (e) { console.error("notification dispatch failed", e); }
        return Response.json({ ...result, notifications });
      },
    },
  },
});
