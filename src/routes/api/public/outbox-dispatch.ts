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
        return Response.json(result);
      },
    },
  },
});
