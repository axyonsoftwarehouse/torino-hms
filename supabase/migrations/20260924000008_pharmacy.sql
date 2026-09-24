-- =============================================================================
-- Torino HMS — Farmácia / Estoque de medicamentos
-- Inspirado em medicine / medicine_category / medicine_batches /
-- medicine_stock_movements / medicine_suppliers / medicine_low_stock do sistema
-- de referência, normalizado.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_movement_type') then
    create type public.stock_movement_type as enum (
      'in', 'out', 'adjustment', 'expired', 'damaged', 'return'
    );
  end if;
end;
$$;

create table if not exists public.medicine_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.suppliers (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  name           text not null,
  company_name   text,
  contact_person text,
  email          text,
  phone          text,
  address        text,
  tax_number     text,
  status         text not null default 'active',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.medicines (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  name                 text not null,
  generic_name         text,
  category_id          uuid references public.medicine_categories(id) on delete set null,
  manufacturer         text,
  unit                 text,
  purchase_price_cents integer not null default 0,
  sale_price_cents     integer not null default 0,
  reorder_level        integer not null default 0,
  notes                text,
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.medicine_batches (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  medicine_id     uuid not null references public.medicines(id) on delete cascade,
  supplier_id     uuid references public.suppliers(id) on delete set null,
  batch_number    text not null,
  expiry_date     date,
  quantity        integer not null default 0,
  unit_cost_cents integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  medicine_id     uuid not null references public.medicines(id) on delete cascade,
  batch_id        uuid references public.medicine_batches(id) on delete set null,
  movement_type   public.stock_movement_type not null,
  quantity        integer not null,
  unit_cost_cents integer not null default 0,
  reference       text,
  notes           text,
  performed_by    uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists medicines_tenant_idx        on public.medicines (tenant_id, name);
create index if not exists medicine_batches_lookup_idx  on public.medicine_batches (tenant_id, medicine_id, expiry_date);
create index if not exists stock_movements_lookup_idx   on public.stock_movements (tenant_id, medicine_id, created_at desc);
create index if not exists suppliers_tenant_idx         on public.suppliers (tenant_id, name);

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'medicine_categories', 'suppliers', 'medicines', 'medicine_batches', 'stock_movements'
  ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'tenant_isolation_' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (tenant_id = public.current_tenant_id() or public.is_superadmin()) '
      || 'with check (tenant_id = public.current_tenant_id() or public.is_superadmin())',
      'tenant_isolation_' || t, t
    );
  end loop;

  for t in select unnest(array['medicine_categories', 'suppliers', 'medicines', 'medicine_batches'])
  loop
    execute format('drop trigger if exists %I on public.%I', 'trg_' || t || '_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'trg_' || t || '_updated_at', t
    );
  end loop;
end;
$$;

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
