# Store setup — what is still needed before taking real orders

## 1. Commerce config (blocks ordering until set)
Sign in at `/admin` as an **admin** → **الإعدادات** tab:
- Unit price (EGP). Compare-at price only if it is a real previous price.
- Flat shipping fee per order (current: 80 EGP), optional per-governorate overrides.
Current confirmed values: Dutti, 750 EGP (was 800), flat 80 EGP shipping per order. Shipping covers all 27 governorates at the flat fee.
The confirm button stays disabled and the server rejects orders (`not_configured`) until a price and at least one governorate rate exist. All totals are computed in the database function `create_cod_order`; browser prices are never trusted.

Still to publish on the page once supplied: return/exchange policy, warranty, official contacts, real reviews.

## 2. First admin / staff account (no public signup grants access)
1. Lovable → More → Users → **Add user** → create the account (email + password).
2. Grant the role (run in Lovable Cloud SQL):
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'owner@example.com';
   -- staff (orders only, no settings): role 'staff'
   ```
Anyone who signs up without a role sees "مفيش صلاحية" and RLS returns no rows.

## 3. Google Sheet (existing — do not create another)
Destination: https://docs.google.com/spreadsheets/d/1BcS0E30EHFlcXRnIGf9Y0rDoGPVULO54cyRmYOqZ87M/edit (already set in the workflow JSON).
Make sure the tab is named **Orders** and row 1 headers are exactly:
`Order ID | Order Date | Customer Name | Phone Number | Governorate | City | Full Address | Product Name | Product Color | Product Size | Quantity | Unit Price | Shipping Fee | Discount | Total Price | Payment Method | Order Status | Customer Notes | UTM Source | UTM Campaign | Sync Status`
Order Date is sent already formatted in Africa/Cairo time.

## 4. n8n
1. Import `docs/n8n-orders-to-sheets.workflow.json`.
2. Webhook node → credential **Header Auth**: name `X-Webhook-Token`, value = a long random string you generate (password manager / `openssl rand -hex 32`).
3. Sheets node → connect your Google account (OAuth2) and paste the sheet URL. It does **append or update matching "Order ID"**, so retries never create duplicate rows.
4. Activate the workflow, copy the **Production URL**.
5. In Lovable Project Settings → Secrets add `N8N_WEBHOOK_URL` (production URL) and `N8N_WEBHOOK_TOKEN` (same token).

## 5. Reliability design
- Order + outbox row are inserted in one transaction (`create_cod_order`). Idempotency key per checkout prevents duplicates on double-click/retry.
- Rate limits: 5 orders/hour per hashed IP, 3/day per phone; honeypot + minimum fill time.
- Dispatcher (`dispatchOutbox`) runs inline right after an order (best effort), from the hourly scheduled job `/api/public/outbox-dispatch`, and from the admin "إعادة مزامنة" buttons. Failures back off exponentially (max 10 attempts); `sync_status` = Pending / Synced / Failed.
- Status changes in admin enqueue a new outbox event so the sheet row is updated.
- The integration is shown as verified only after n8n returns `{ok:true}` for a real order.

## 6. Tracking (prepared, inactive)
`src/lib/tracking.ts` is a no-op until `VITE_META_PIXEL_ID` / `VITE_GA4_ID` exist. COD orders fire `Lead` (not `Purchase`) deduplicated by order number; no name/phone/address is sent. Before enabling: decide consent banner route and update a privacy policy.
