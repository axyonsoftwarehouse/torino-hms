-- =============================================================================
-- Torino HMS — Laudos clínicos
-- Inspirado na tabela `report` do sistema de referência (report_type
-- birth/operation/expire, patient, doctor, date, description), normalizado.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'medical_report_type') then
    create type public.medical_report_type as enum ('birth', 'operation', 'death', 'general');
  end if;
end;
$$;

create table if not exists public.medical_reports (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  encounter_id    uuid references public.encounters(id) on delete set null,
  report_type     public.medical_report_type not null default 'general',
  title           text,
  description     text,
  report_date     date not null default current_date,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists medical_reports_lookup_idx
  on public.medical_reports (tenant_id, report_type, report_date desc);

alter table public.medical_reports enable row level security;

drop policy if exists tenant_isolation_medical_reports on public.medical_reports;
create policy tenant_isolation_medical_reports on public.medical_reports
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superadmin())
  with check (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop trigger if exists trg_medical_reports_updated_at on public.medical_reports;
create trigger trg_medical_reports_updated_at
  before update on public.medical_reports
  for each row execute function public.set_updated_at();

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
