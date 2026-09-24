-- =============================================================================
-- Torino HMS — Convênios / Seguros
-- Inspirado na tabela insurance_company do sistema de referência.
-- Adiciona o vínculo do paciente ao convênio.
-- =============================================================================

create table if not exists public.insurance_companies (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  name           text not null,
  ans_code       text,
  contact_person text,
  phone          text,
  email          text,
  notes          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists insurance_companies_tenant_idx
  on public.insurance_companies (tenant_id, name);

alter table public.patients
  add column if not exists insurance_company_id uuid references public.insurance_companies(id) on delete set null,
  add column if not exists insurance_card_number text;

create index if not exists patients_insurance_idx on public.patients (insurance_company_id);

alter table public.insurance_companies enable row level security;

drop policy if exists tenant_isolation_insurance_companies on public.insurance_companies;
create policy tenant_isolation_insurance_companies on public.insurance_companies
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superadmin())
  with check (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop trigger if exists trg_insurance_companies_updated_at on public.insurance_companies;
create trigger trg_insurance_companies_updated_at
  before update on public.insurance_companies
  for each row execute function public.set_updated_at();

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
