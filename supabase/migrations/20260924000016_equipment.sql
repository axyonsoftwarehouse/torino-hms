-- =============================================================================
-- Torino HMS — Engenharia Clínica
-- Gestão do parque tecnológico: equipamentos, manutenção preventiva e
-- ordens de serviço (corretiva/calibração/inspeção). Diferencial Brasil (ANVISA).
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'equipment_criticality') then
    create type public.equipment_criticality as enum ('low', 'medium', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'equipment_status') then
    create type public.equipment_status as enum ('active', 'maintenance', 'inactive', 'decommissioned');
  end if;
  if not exists (select 1 from pg_type where typname = 'service_order_type') then
    create type public.service_order_type as enum ('preventive', 'corrective', 'calibration', 'inspection');
  end if;
  if not exists (select 1 from pg_type where typname = 'service_order_status') then
    create type public.service_order_status as enum ('open', 'in_progress', 'done', 'canceled');
  end if;
end;
$$;

create table if not exists public.equipment_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.equipment (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references public.tenants(id) on delete cascade,
  category_id            uuid references public.equipment_categories(id) on delete set null,
  name                   text not null,
  asset_tag              text,
  serial_number          text,
  manufacturer           text,
  model                  text,
  anvisa_registration    text,
  location               text,
  responsible            text,
  acquisition_date       date,
  acquisition_value_cents integer not null default 0,
  warranty_until         date,
  criticality            public.equipment_criticality not null default 'medium',
  status                 public.equipment_status not null default 'active',
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.maintenance_plans (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  equipment_id    uuid not null references public.equipment(id) on delete cascade,
  description     text not null,
  periodicity_days integer not null default 180,
  last_done_at    date,
  next_due_date   date,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.service_orders (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  equipment_id  uuid not null references public.equipment(id) on delete cascade,
  number        text not null,
  type          public.service_order_type not null default 'corrective',
  status        public.service_order_status not null default 'open',
  opened_at     timestamptz not null default now(),
  scheduled_at  date,
  closed_at     timestamptz,
  technician    text,
  cost_cents    integer not null default 0,
  description   text,
  findings      text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists equipment_tenant_idx        on public.equipment (tenant_id, status);
create index if not exists equipment_category_idx      on public.equipment (category_id);
create index if not exists maintenance_plans_due_idx   on public.maintenance_plans (tenant_id, next_due_date);
create index if not exists service_orders_lookup_idx   on public.service_orders (tenant_id, status, opened_at desc);
create index if not exists service_orders_equipment_idx on public.service_orders (equipment_id);

-- RLS
do $$
declare
  t text;
begin
  for t in select unnest(array['equipment_categories', 'equipment', 'maintenance_plans', 'service_orders'])
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
end;
$$;

-- updated_at
do $$
declare
  t text;
begin
  for t in select unnest(array['equipment_categories', 'equipment', 'maintenance_plans', 'service_orders'])
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
