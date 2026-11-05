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
