-- =============================================================================
-- Torino HMS — Cupons de desconto (SaaS billing)
-- Inspirado no módulo Coupons do Perfect SaaS / Perfex.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'coupon_discount_type') then
    create type public.coupon_discount_type as enum ('percent', 'fixed');
  end if;
end;
$$;

create table if not exists public.coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  description    text,
  discount_type  public.coupon_discount_type not null default 'percent',
  discount_value integer not null default 0,
  active         boolean not null default true,
  valid_until    date,
  max_uses       integer,
  used_count     integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table public.saas_invoices
  add column if not exists coupon_code text,
  add column if not exists discount_cents integer not null default 0;

create index if not exists coupons_code_idx on public.coupons (code);

alter table public.coupons enable row level security;

drop policy if exists platform_coupons on public.coupons;
create policy platform_coupons on public.coupons
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
