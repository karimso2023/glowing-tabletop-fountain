
alter table public.store_config add column flat_shipping_fee numeric(10,2) check (flat_shipping_fee is null or flat_shipping_fee >= 0);
alter table public.store_config add column store_name text;

create or replace function public.create_cod_order(
  p_idempotency_key uuid, p_ip_hash text, p_name text, p_phone text, p_governorate text,
  p_city text, p_address text, p_quantity int, p_notes text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cfg public.store_config;
  existing public.orders;
  fee numeric; sub numeric; o public.orders;
begin
  select * into existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('ok',true,'duplicate',true,'order_number',existing.order_number,'total_price',existing.total_price);
  end if;

  select * into cfg from public.store_config where id = 1;
  if cfg.unit_price is null or (cfg.shipping_rates is null and cfg.flat_shipping_fee is null) then
    return jsonb_build_object('ok',false,'error','not_configured');
  end if;
  -- Per-governorate rate wins; otherwise flat per-order fee.
  if cfg.shipping_rates is not null and cfg.shipping_rates ? p_governorate then
    fee := (cfg.shipping_rates ->> p_governorate)::numeric;
  elsif cfg.flat_shipping_fee is not null then
    fee := cfg.flat_shipping_fee;
  else
    return jsonb_build_object('ok',false,'error','governorate_unavailable');
  end if;
  if p_quantity < 1 or p_quantity > cfg.max_quantity then
    return jsonb_build_object('ok',false,'error','bad_quantity');
  end if;

  if p_ip_hash is not null and (select count(*) from public.orders where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('ok',false,'error','rate_limited');
  end if;
  if (select count(*) from public.orders where phone = p_phone and created_at > now() - interval '24 hours') >= 3 then
    return jsonb_build_object('ok',false,'error','rate_limited');
  end if;

  sub := cfg.unit_price * p_quantity;
  insert into public.orders (order_number, idempotency_key, ip_hash, customer_name, phone, governorate, city, full_address,
    product_id, product_name, quantity, unit_price, shipping_fee, discount_amount, total_price, customer_notes,
    utm_source, utm_medium, utm_campaign, utm_content)
  values ('MYA-' || to_char(now() at time zone 'Africa/Cairo','YYMMDD') || '-' || nextval('public.order_number_seq'),
    p_idempotency_key, p_ip_hash, p_name, p_phone, p_governorate, p_city, p_address,
    cfg.product_id, cfg.product_name, p_quantity, cfg.unit_price, fee, 0, sub + fee, p_notes,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content)
  returning * into o;

  insert into public.order_outbox (order_id) values (o.id);
  return jsonb_build_object('ok',true,'duplicate',false,'order_number',o.order_number,'total_price',o.total_price);
exception when unique_violation then
  select * into existing from public.orders where idempotency_key = p_idempotency_key;
  return jsonb_build_object('ok',true,'duplicate',true,'order_number',existing.order_number,'total_price',existing.total_price);
end $$;
revoke all on function public.create_cod_order(uuid,text,text,text,text,text,text,int,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_cod_order(uuid,text,text,text,text,text,text,int,text,text,text,text,text) to service_role;
