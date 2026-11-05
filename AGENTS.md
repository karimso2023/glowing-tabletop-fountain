<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Orders are created only via the SECURITY DEFINER SQL function `create_cod_order` (service_role only), called from `createOrder` server fn; prices/shipping come from `store_config`, never from the client.
- Google Sheets sync goes through `order_outbox` + `dispatchOutbox` (src/lib/sync.server.ts) to an n8n webhook; never send webhooks from the browser.
- Admin access = `user_roles` (admin/staff) checked by RLS (`is_order_staff`, `has_role`); signup grants nothing.
- Commerce config values left NULL mean "not supplied"; UI must show unavailable, not invent values.
- Visitor IP/geo is trusted only from src/server.ts edge injection (request.cf + cf-connecting-ip, nonce-tagged x-dutti-* headers); never X-Forwarded-For. Why: other headers are client-spoofable.
- Visitor analytics are consent-gated, keyed by an HttpOnly random cookie (hashed in DB), written only via service-role RPCs, and readable only by admins (`admin_visitor_stats`, `order_attribution` policy); order attribution is best-effort and must never block order creation or enter Sheets/staff CSV.
- Product video loading and one-time viewport playback live in ProductVideo; native controls and manual pause take precedence over autoplay.
