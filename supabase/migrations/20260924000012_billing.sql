-- =============================================================================
-- Torino HMS — Billing do SaaS (assinaturas dos tenants)
-- Inspirado no módulo de compras do Perfex (contracts, invoices, payments,
-- debit notes/refund, statement, numbering).
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'billing_cycle') then
    create type public.billing_cycle as enum ('monthly', 'annual');
  end if;
  if not exists (select 1 from pg_type where typname = 'saas_subscription_status') then
    create type public.saas_subscription_status as enum (
      'trial', 'active', 'past_due', 'suspended', 'canceled'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'saas_invoice_status') then
    create type public.saas_invoice_status as enum ('draft', 'issued', 'paid', 'canceled');
  end if;
  if not exists (select 1 from pg_type where typname = 'saas_adjustment_kind') then
    create type public.saas_adjustment_kind as enum ('credit', 'debit', 'refund');
  end if;
end;
$$;

-- Catálogo de preços dos planos (plataforma)
create table if not exists public.saas_plans (
  key                 text primary key,
  name                text not null,
  monthly_price_cents integer not null default 0,
  annual_price_cents  integer not null default 0,
  active              boolean not null default true,
  updated_at          timestamptz not null default now()
);

-- Assinatura por tenant (uma por tenant)
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  plan_key      text not null references public.saas_plans(key),
  cycle         public.billing_cycle not null default 'monthly',
  amount_cents  integer not null default 0,
  status        public.saas_subscription_status not null default 'trial',
  started_at    date not null default current_date,
  next_due_date date,
  trial_ends_at date,
  canceled_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists subscriptions_tenant_uidx on public.subscriptions (tenant_id);

-- Faturas do SaaS
create table if not exists public.saas_invoices (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  number       text not null,
  status       public.saas_invoice_status not null default 'draft',
  total_cents  integer not null default 0,
  due_date     date,
  issued_at    timestamptz,
  period_start date,
  period_end   date,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.saas_invoice_items (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references public.saas_invoices(id) on delete cascade,
  description      text not null,
  quantity         integer not null default 1,
  unit_price_cents integer not null default 0,
  total_cents      integer not null default 0,
  created_at       timestamptz not null default now()
);

create table if not exists public.saas_payments (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  invoice_id   uuid not null references public.saas_invoices(id) on delete cascade,
  amount_cents integer not null,
  method       public.payment_method not null default 'pix',
  paid_at      date not null default current_date,
  reference    text,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.saas_adjustments (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  invoice_id   uuid not null references public.saas_invoices(id) on delete cascade,
  kind         public.saas_adjustment_kind not null,
  amount_cents integer not null,
  reason       text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists saas_invoices_tenant_idx on public.saas_invoices (tenant_id, status);
create index if not exists saas_invoices_number_idx on public.saas_invoices (number);
create index if not exists saas_invoice_items_invoice_idx on public.saas_invoice_items (invoice_id);
create index if not exists saas_payments_invoice_idx on public.saas_payments (invoice_id);
create index if not exists saas_adjustments_invoice_idx on public.saas_adjustments (invoice_id);

-- RLS
do $$
declare
  t text;
begin
  for t in select unnest(array['saas_plans', 'subscriptions', 'saas_invoices', 'saas_payments', 'saas_adjustments'])
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

drop policy if exists platform_saas_plans on public.saas_plans;
create policy platform_saas_plans on public.saas_plans
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

do $$
declare
  t text;
begin
  for t in select unnest(array['subscriptions', 'saas_invoices', 'saas_payments', 'saas_adjustments'])
  loop
    execute format('drop policy if exists %I on public.%I', 'tenant_isolation_' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (tenant_id = public.current_tenant_id() or public.is_superadmin()) '
      || 'with check (tenant_id = public.current_tenant_id() or public.is_superadmin())',
      'tenant_isolation_' || t, t
    );
  end loop;
end;
$$;

alter table public.saas_invoice_items enable row level security;
drop policy if exists tenant_isolation_saas_invoice_items on public.saas_invoice_items;
create policy tenant_isolation_saas_invoice_items on public.saas_invoice_items
  for all to authenticated
  using (
    exists (
      select 1 from public.saas_invoices i
      where i.id = invoice_id
        and (i.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  )
  with check (
    exists (
      select 1 from public.saas_invoices i
      where i.id = invoice_id
        and (i.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  );

-- updated_at
do $$
declare
  t text;
begin
  for t in select unnest(array['subscriptions', 'saas_invoices'])
  loop
    execute format('drop trigger if exists %I on public.%I', 'trg_' || t || '_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'trg_' || t || '_updated_at', t
    );
  end loop;
end;
$$;

-- Seed de preços
insert into public.saas_plans (key, name, monthly_price_cents, annual_price_cents) values
  ('basico', 'Básico (Clínica)', 29900, 299000),
  ('clinica', 'Clínica+ / Odonto', 49900, 499000),
  ('diagnostico', 'Diagnóstico', 69900, 699000),
  ('farmacia', 'Farmácia', 39900, 399000),
  ('hospital', 'Hospital Completo', 129900, 1299000)
on conflict (key) do nothing;

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
