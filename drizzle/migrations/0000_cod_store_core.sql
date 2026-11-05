
create type public.app_role as enum ('admin', 'staff');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.is_order_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','staff')) $$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- Single-row store configuration. NULL = not supplied by owner yet.
create table public.store_config (
  id smallint primary key default 1 check (id = 1),
  product_id text not null default 'mia-led-tabletop-fountain',
  product_name text not null default 'نافورة ميا LED صغيرة',
  unit_price numeric(10,2) check (unit_price is null or unit_price > 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price > 0),
  shipping_rates jsonb, -- {"القاهرة": 60, ...}; NULL = not configured
  max_quantity int not null default 5 check (max_quantity between 1 and 20),
  updated_at timestamptz not null default now()
);
insert into public.store_config (id) values (1);
grant select on public.store_config to anon, authenticated;
grant update on public.store_config to authenticated;
grant all on public.store_config to service_role;
alter table public.store_config enable row level security;
create policy "public reads config" on public.store_config for select to anon, authenticated using (true);
create policy "admin updates config" on public.store_config for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  idempotency_key uuid not null unique,
  ip_hash text,
  customer_name text not null,
  phone text not null,
  governorate text not null,
  city text not null,
  full_address text not null,
  product_id text not null,
  product_name text not null,
  selected_color text,
  selected_size text,
  quantity int not null check (quantity between 1 and 20),
  unit_price numeric(10,2) not null,
  shipping_fee numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  total_price numeric(10,2) not null,
  payment_method text not null default 'COD',
  order_status text not null default 'New'
    check (order_status in ('New','Pending Confirmation','Confirmed','Shipped','Completed','Cancelled')),
  customer_notes text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text,
  sync_status text not null default 'Pending' check (sync_status in ('Pending','Synced','Failed'))
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_phone_idx on public.orders (phone);
create index orders_ip_idx on public.orders (ip_hash, created_at);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "staff read orders" on public.orders for select to authenticated using (public.is_order_staff(auth.uid()));
create policy "staff update orders" on public.orders for update to authenticated
  using (public.is_order_staff(auth.uid())) with check (public.is_order_staff(auth.uid()));

-- Staff may only change order_status; everything else is immutable from the client.
create or replace function public.orders_guard_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if row(new.order_number,new.customer_name,new.phone,new.governorate,new.city,new.full_address,
           new.quantity,new.unit_price,new.shipping_fee,new.discount_amount,new.total_price,
           new.sync_status,new.idempotency_key,new.created_at)
       is distinct from
       row(old.order_number,old.customer_name,old.phone,old.governorate,old.city,old.full_address,
           old.quantity,old.unit_price,old.shipping_fee,old.discount_amount,old.total_price,
           old.sync_status,old.idempotency_key,old.created_at) then
      raise exception 'only order_status can be changed';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger orders_guard before update on public.orders for each row execute function public.orders_guard_update();

create table public.order_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null default 'order.upsert',
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index outbox_due_idx on public.order_outbox (status, next_attempt_at);
grant select on public.order_outbox to authenticated;
grant all on public.order_outbox to service_role;
alter table public.order_outbox enable row level security;
create policy "staff read outbox" on public.order_outbox for select to authenticated using (public.is_order_staff(auth.uid()));

create table public.integration_status (
  key text primary key,
  verified_at timestamptz,
  last_checked_at timestamptz,
  detail text
);
grant select on public.integration_status to authenticated;
grant all on public.integration_status to service_role;
alter table public.integration_status enable row level security;
create policy "admin read integrations" on public.integration_status for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Transactional order + outbox creation with server-side pricing, idempotency and rate limiting.
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
  if cfg.unit_price is null or cfg.shipping_rates is null then
    return jsonb_build_object('ok',false,'error','not_configured');
  end if;
  if not (cfg.shipping_rates ? p_governorate) then
    return jsonb_build_object('ok',false,'error','governorate_unavailable');
  end if;
  fee := (cfg.shipping_rates ->> p_governorate)::numeric;
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

-- Status change => enqueue a sheet update.
create or replace function public.orders_enqueue_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.order_status is distinct from old.order_status then
    insert into public.order_outbox (order_id) values (new.id);
    update public.orders set sync_status = 'Pending' where id = new.id and sync_status <> 'Pending';
  end if;
  return new;
end $$;
create trigger orders_enqueue_status after update of order_status on public.orders for each row execute function public.orders_enqueue_status();

create or replace function public.claim_outbox(p_limit int)
returns setof public.order_outbox language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.order_outbox b set status = 'processing', attempts = b.attempts + 1, locked_until = now() + interval '2 minutes'
  where b.id in (
    select id from public.order_outbox
    where (status in ('pending','failed') and next_attempt_at <= now() and attempts < 10)
       or (status = 'processing' and locked_until < now())
    order by created_at limit p_limit for update skip locked)
  returning b.*;
end $$;
revoke all on function public.claim_outbox(int) from public, anon, authenticated;
grant execute on function public.claim_outbox(int) to service_role;
