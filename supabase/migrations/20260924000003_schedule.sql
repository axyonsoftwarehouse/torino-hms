-- =============================================================================
-- Torino HMS — Disponibilidade semanal dos profissionais
-- Inspirado na tabela time_schedule do sistema de referência (weekday, s_time,
-- e_time, duration), porém normalizado com timestamptz/time e FK.
-- =============================================================================

create table if not exists public.professional_schedules (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday         smallint not null check (weekday between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  slot_minutes    integer not null default 30 check (slot_minutes between 5 and 240),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists professional_schedules_lookup_idx
  on public.professional_schedules (tenant_id, professional_id, weekday);

alter table public.professional_schedules enable row level security;

drop policy if exists tenant_isolation_professional_schedules on public.professional_schedules;
create policy tenant_isolation_professional_schedules on public.professional_schedules
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superadmin())
  with check (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop trigger if exists trg_professional_schedules_updated_at on public.professional_schedules;
create trigger trg_professional_schedules_updated_at
  before update on public.professional_schedules
  for each row execute function public.set_updated_at();

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
