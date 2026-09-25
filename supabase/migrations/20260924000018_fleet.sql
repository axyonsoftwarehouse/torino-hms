-- =============================================================================
-- Torino HMS — Frota / Ambulância
-- Inspirado no Perfex CRM Fleet Management (veículos, motoristas, viagens,
-- manutenção, combustível, documentos) e na tabela ambulance do original.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'fleet_vehicle_type') then
    create type public.fleet_vehicle_type as enum ('ambulance_basic', 'ambulance_advanced', 'administrative', 'van', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'fleet_vehicle_status') then
    create type public.fleet_vehicle_status as enum ('available', 'in_use', 'maintenance', 'inactive');
  end if;
  if not exists (select 1 from pg_type where typname = 'fleet_trip_status') then
    create type public.fleet_trip_status as enum ('scheduled', 'in_progress', 'completed', 'canceled');
  end if;
  if not exists (select 1 from pg_type where typname = 'fleet_maintenance_type') then
    create type public.fleet_maintenance_type as enum ('preventive', 'corrective', 'inspection');
  end if;
end;
$$;

create table if not exists public.fleet_vehicles (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  plate         text,
  type          public.fleet_vehicle_type not null default 'ambulance_basic',
  brand         text,
  model         text,
  model_year    integer,
  color         text,
  renavam       text,
  chassi        text,
  fuel_type     text,
  ownership     text not null default 'own',
  capacity      integer,
  odometer_km   integer not null default 0,
  location      text,
  status        public.fleet_vehicle_status not null default 'available',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.fleet_drivers (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  full_name       text not null,
  cnh_number      text,
  cnh_category    text,
  cnh_expires_at  date,
  phone           text,
  email           text,
  professional_id uuid references public.professionals(id) on delete set null,
  active          boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.fleet_trips (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  vehicle_id     uuid not null references public.fleet_vehicles(id) on delete cascade,
  driver_id      uuid references public.fleet_drivers(id) on delete set null,
  patient_id     uuid references public.patients(id) on delete set null,
  trip_type      text not null default 'removal',
  origin         text,
  destination    text,
  scheduled_at   timestamptz,
  started_at     timestamptz,
  ended_at       timestamptz,
  odometer_start integer,
  odometer_end   integer,
  status         public.fleet_trip_status not null default 'scheduled',
  requester      text,
  notes          text,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.fleet_maintenance (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  vehicle_id    uuid not null references public.fleet_vehicles(id) on delete cascade,
  type          public.fleet_maintenance_type not null default 'preventive',
  description   text,
  service_date  date not null default current_date,
  odometer_km   integer,
  provider      text,
  cost_cents    integer not null default 0,
  next_due_date date,
  notes         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.fleet_fuel (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  vehicle_id     uuid not null references public.fleet_vehicles(id) on delete cascade,
  driver_id      uuid references public.fleet_drivers(id) on delete set null,
  fueled_at      date not null default current_date,
  liters         numeric not null default 0,
  unit_price_cents integer not null default 0,
  total_cents    integer not null default 0,
  odometer_km    integer,
  station        text,
  notes          text,
  created_at     timestamptz not null default now()
);

create table if not exists public.fleet_documents (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  vehicle_id  uuid not null references public.fleet_vehicles(id) on delete cascade,
  doc_type    text not null default 'crlv',
  number      text,
  issued_at   date,
  expires_at  date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists fleet_vehicles_plate_uidx on public.fleet_vehicles (tenant_id, plate);
create index if not exists fleet_vehicles_status_idx on public.fleet_vehicles (tenant_id, status);
create index if not exists fleet_trips_lookup_idx on public.fleet_trips (tenant_id, status, scheduled_at desc);
create index if not exists fleet_maintenance_vehicle_idx on public.fleet_maintenance (vehicle_id);
create index if not exists fleet_fuel_vehicle_idx on public.fleet_fuel (vehicle_id);
create index if not exists fleet_documents_expiry_idx on public.fleet_documents (tenant_id, expires_at);
create index if not exists fleet_drivers_cnh_idx on public.fleet_drivers (tenant_id, cnh_expires_at);

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'fleet_vehicles', 'fleet_drivers', 'fleet_trips', 'fleet_maintenance', 'fleet_fuel', 'fleet_documents'
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

    if t <> 'fleet_fuel' then
      execute format('drop trigger if exists %I on public.%I', 'trg_' || t || '_updated_at', t);
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        'trg_' || t || '_updated_at', t
      );
    end if;
  end loop;
end;
$$;

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
