import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const trackSchema = z.object({
  kind: z.enum(["pageview", "heartbeat", "checkout_start"]),
  pageviewId: z.string().uuid(),
  referrer: z.string().max(1000).optional().default(""),
  path: z.string().max(300).optional().default("/"),
  utm: z.record(z.string().max(300)).optional().default({}),
});

/** Consent-gated visitor tracking. Session identity = HttpOnly random cookie; IP/geo from trusted edge only. */
export const trackVisit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => trackSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const { getCookie, setCookie, getRequestHeader } = await import("@tanstack/react-start/server");
      const core = await import("./analytics-core");
      const srv = await import("./analytics.server");
      let token = getCookie(core.ANALYTICS_COOKIE);
      if (!core.isValidToken(token)) {
        if (data.kind !== "pageview") return { ok: false };
        token = srv.newToken();
      }
      setCookie(core.ANALYTICS_COOKIE, token, {
        httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
      });
      const tokenHash = await srv.sha256Hex(`dutti-as:${token}`);
      const client = srv.getTrustedClient();
      const ref = core.safeReferrer(data.referrer, getRequestHeader("host")?.split(":")[0]);
      const utm = core.cleanUtm(data.utm);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const n = null as unknown as string;
      const { data: r, error } = await supabaseAdmin.rpc("analytics_track", {
        p_token_hash: tokenHash, p_kind: data.kind, p_pageview_id: data.pageviewId,
        p_is_bot: core.isBotUserAgent(getRequestHeader("user-agent")),
        p_ip: client.ip ?? n, p_ip_hash: client.ip ? await srv.sha256Hex(`dutti-rl:${client.ip}`) : n,
        p_country: client.country ?? n, p_region: client.region ?? n, p_city: client.city ?? n,
        p_ref_host: ref.host ?? n, p_ref_path: ref.path ?? n, p_landing: core.cleanPath(data.path),
        p_utm_source: utm.source ?? n, p_utm_medium: utm.medium ?? n, p_utm_campaign: utm.campaign ?? n, p_utm_content: utm.content ?? n,
      });
      if (error) { console.error("analytics_track failed"); return { ok: false }; }
      return { ok: Boolean((r as { ok?: boolean } | null)?.ok) };
    } catch {
      return { ok: false };
    }
  });

/** Consent withdrawn: drop the session cookie so nothing further links to it. */
export const analyticsOptOut = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie("dutti_as", { path: "/" });
  return { ok: true };
});

/** Admin-only aggregate stats (the RPC itself re-checks the admin role). */
export const getVisitorStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: stats, error } = await context.supabase.rpc("admin_visitor_stats", { p_from: data.from, p_to: data.to });
    if (error) throw new Error(error.message);
    return stats as unknown as VisitorStats;
  });

export type VisitorStats = {
  pageviews: number; sessions: number; new_sessions: number; checkout_starts: number;
  orders_total: number; orders_from_tracked_sessions: number; orders_with_attribution: number;
  active_now: number; bot_sessions: number;
  by_day: { day: string; sessions: number; pageviews: number }[];
  geo: { country: string | null; region: string | null; city: string | null; n: number }[];
  sources: { source: string; medium: string | null; campaign: string | null; n: number }[];
};
