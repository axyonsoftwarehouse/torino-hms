-- =============================================================================
-- Torino HMS — Leitos / Internação (módulo hospitalar)
-- Inspirado em bed_category / bed / alloted_bed / bed_checkout do sistema de
-- referência, normalizado com FKs, enums e timestamptz.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'bed_status') then
    create type public.bed_status as enum ('available', 'occupied', 'maintenance');
  end if;
  if not exists (select 1 from pg_type where typname = 'bed_assignment_status') then
    create type public.bed_assignment_status as enum ('active', 'discharged');
  end if;
end;
$$;

-- Categorias de leito (enfermaria, quarto, UTI...)
create table if not exists public.bed_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Leitos
create table if not exists public.beds (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  category_id      uuid references public.bed_categories(id) on delete set null,
  number           text not null,
  description      text,
  status           public.bed_status not null default 'available',
  daily_rate_cents integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Internações
create table if not exists public.bed_assignments (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  bed_id          uuid not null references public.beds(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  admitted_at     timestamptz not null default now(),
  discharged_at   timestamptz,
  status          public.bed_assignment_status not null default 'active',
  diagnosis       text,
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Alta hospitalar
create table if not exists public.bed_discharges (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  assignment_id    uuid not null references public.bed_assignments(id) on delete cascade,
  discharged_at    timestamptz not null default now(),
  final_diagnosis  text,
  summary          text,
  instructions     text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists beds_tenant_category_idx on public.beds (tenant_id, category_id);
create index if not exists bed_assignments_lookup_idx on public.bed_assignments (tenant_id, status, admitted_at desc);
create index if not exists bed_assignments_bed_idx on public.bed_assignments (bed_id);
create index if not exists bed_discharges_assignment_idx on public.bed_discharges (assignment_id);

-- RLS
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'bed_categories', 'beds', 'bed_assignments', 'bed_discharges'
  ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'drop policy if exists %I on public.%I',
      'tenant_isolation_' || t, t
    );
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
  for t in select unnest(array['bed_categories', 'beds', 'bed_assignments'])
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
