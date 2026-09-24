-- =============================================================================
-- Torino HMS — Compras (Ordens de compra + contas a pagar)
-- Inspirado em medicine_purchases / medicine_purchase_items /
-- medicine_purchase_payments / purchase_orders / purchase_order_items,
-- normalizado. Ao receber, gera lotes + movimentações de estoque.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'purchase_order_status') then
    create type public.purchase_order_status as enum ('draft', 'ordered', 'received', 'canceled');
  end if;
end;
$$;

create table if not exists public.purchase_orders (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references public.tenants(id) on delete cascade,
  supplier_id            uuid references public.suppliers(id) on delete set null,
  number                 text not null,
  status                 public.purchase_order_status not null default 'draft',
  order_date             date not null default current_date,
  expected_delivery_date date,
  received_at            timestamptz,
  invoice_number         text,
  invoice_date           date,
  total_cents            integer not null default 0,
  notes                  text,
  created_by             uuid references public.profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id                uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  medicine_id       uuid references public.medicines(id) on delete set null,
  description       text,
  quantity          integer not null default 1,
  unit_cost_cents   integer not null default 0,
  total_cents       integer not null default 0,
  expiry_date       date,
  batch_number      text,
  created_at        timestamptz not null default now()
);

create table if not exists public.purchase_payments (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  amount_cents      integer not null,
  method            public.payment_method not null default 'pix',
  paid_at           date not null default current_date,
  reference         text,
  notes             text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists purchase_orders_tenant_idx on public.purchase_orders (tenant_id, order_date desc);
create index if not exists purchase_order_items_order_idx on public.purchase_order_items (purchase_order_id);
create index if not exists purchase_payments_order_idx on public.purchase_payments (purchase_order_id);

alter table public.purchase_orders enable row level security;
alter table public.purchase_payments enable row level security;
alter table public.purchase_order_items enable row level security;

drop policy if exists tenant_isolation_purchase_orders on public.purchase_orders;
create policy tenant_isolation_purchase_orders on public.purchase_orders
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superadmin())
  with check (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop policy if exists tenant_isolation_purchase_payments on public.purchase_payments;
create policy tenant_isolation_purchase_payments on public.purchase_payments
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superadmin())
  with check (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop policy if exists tenant_isolation_purchase_order_items on public.purchase_order_items;
create policy tenant_isolation_purchase_order_items on public.purchase_order_items
  for all to authenticated
  using (
    exists (
      select 1 from public.purchase_orders o
      where o.id = purchase_order_id
        and (o.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  )
  with check (
    exists (
      select 1 from public.purchase_orders o
      where o.id = purchase_order_id
        and (o.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  );

drop trigger if exists trg_purchase_orders_updated_at on public.purchase_orders;
create trigger trg_purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
