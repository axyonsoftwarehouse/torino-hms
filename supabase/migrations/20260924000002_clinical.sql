-- =============================================================================
-- Torino HMS — Clínico (Profissionais, Departamentos e Agenda)
-- Inspirado nas tabelas department / doctor / appointment do sistema de referência,
-- porém normalizado.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Departamentos
-- -----------------------------------------------------------------------------
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists departments_tenant_idx on public.departments (tenant_id);

alter table public.departments enable row level security;

drop policy if exists tenant_isolation_departments on public.departments;
create policy tenant_isolation_departments on public.departments
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superadmin())
  with check (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Profissionais: vínculo a departamento, bio e valor de consulta
-- -----------------------------------------------------------------------------
alter table public.professionals
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists bio text,
  add column if not exists fee_cents integer not null default 0;

create index if not exists professionals_department_idx on public.professionals (department_id);

-- -----------------------------------------------------------------------------
-- Agenda: tipo de atendimento e valor
-- -----------------------------------------------------------------------------
alter table public.appointments
  add column if not exists type text,
  add column if not exists fee_cents integer not null default 0;

create index if not exists appointments_professional_start_idx
  on public.appointments (professional_id, scheduled_start);

-- -----------------------------------------------------------------------------
-- Grants (tabelas novas)
-- -----------------------------------------------------------------------------
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
