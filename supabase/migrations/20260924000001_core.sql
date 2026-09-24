-- =============================================================================
-- Torino HMS — Núcleo (Fase 1)
-- Multi-tenant: schema compartilhado + tenant_id + Row Level Security (RLS).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum (
  'superadmin', 'tenant_admin', 'professional', 'receptionist',
  'nurse', 'pharmacist', 'laboratorist', 'accountant', 'patient'
);

create type public.appointment_status as enum (
  'scheduled', 'confirmed', 'completed', 'canceled', 'no_show'
);

create type public.encounter_status as enum ('open', 'closed');

create type public.invoice_status as enum ('draft', 'issued', 'paid', 'canceled');

create type public.payment_method as enum (
  'cash', 'pix', 'credit_card', 'debit_card', 'transfer', 'insurance', 'other'
);

-- -----------------------------------------------------------------------------
-- Tenants (hospitais / clínicas)
-- -----------------------------------------------------------------------------
create table public.tenants (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  email              text,
  phone              text,
  document           text,
  address            text,
  country            text default 'BR',
  package_key        text not null default 'basico',
  patient_limit      integer,
  professional_limit integer,
  status             text not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.tenant_modules (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  module_key text not null,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (tenant_id, module_key)
);

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid references public.tenants(id) on delete set null,
  full_name  text,
  email      text,
  role       public.user_role not null default 'patient',
  avatar_url text,
  phone      text,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Pacientes
-- -----------------------------------------------------------------------------
create table public.patients (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  full_name  text not null,
  document   text,
  birth_date date,
  gender     text,
  phone      text,
  email      text,
  address    text,
  blood_type text,
  notes      text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- -----------------------------------------------------------------------------
-- Profissionais
-- -----------------------------------------------------------------------------
create table public.professionals (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  profile_id     uuid references public.profiles(id) on delete set null,
  full_name      text not null,
  speciality     text,
  license_number text,
  phone          text,
  email          text,
  color          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Agenda
-- -----------------------------------------------------------------------------
create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  patient_id       uuid not null references public.patients(id) on delete cascade,
  professional_id  uuid references public.professionals(id) on delete set null,
  scheduled_start  timestamptz not null,
  scheduled_end    timestamptz,
  status           public.appointment_status not null default 'scheduled',
  reason           text,
  notes            text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Atendimento / prontuário
-- -----------------------------------------------------------------------------
create table public.encounters (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  appointment_id  uuid references public.appointments(id) on delete set null,
  started_at      timestamptz not null default now(),
  closed_at       timestamptz,
  status          public.encounter_status not null default 'open',
  chief_complaint text,
  diagnosis       text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Prescrições
-- -----------------------------------------------------------------------------
create table public.prescriptions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  encounter_id    uuid references public.encounters(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  notes           text,
  issued_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.prescription_items (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication      text not null,
  dosage          text,
  frequency       text,
  duration        text,
  instructions    text
);

-- -----------------------------------------------------------------------------
-- Serviços
-- -----------------------------------------------------------------------------
create table public.services (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  category    text,
  price_cents integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Financeiro
-- -----------------------------------------------------------------------------
create table public.invoices (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  patient_id   uuid references public.patients(id) on delete set null,
  encounter_id uuid references public.encounters(id) on delete set null,
  number       text,
  status       public.invoice_status not null default 'draft',
  total_cents  integer not null default 0,
  due_date     date,
  issued_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.invoice_items (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references public.invoices(id) on delete cascade,
  service_id       uuid references public.services(id) on delete set null,
  description      text not null,
  quantity         numeric not null default 1,
  unit_price_cents integer not null default 0,
  total_cents      integer not null default 0
);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  invoice_id  uuid references public.invoices(id) on delete set null,
  amount_cents integer not null,
  method      public.payment_method not null default 'cash',
  paid_at     timestamptz not null default now(),
  notes       text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  description text not null,
  amount_cents integer not null,
  spent_at    date not null default current_date,
  method      public.payment_method,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Auditoria
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id         bigint generated always as identity primary key,
  tenant_id  uuid references public.tenants(id) on delete set null,
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  text,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
create index tenants_slug_idx              on public.tenants (slug);
create index profiles_tenant_idx           on public.profiles (tenant_id);
create index patients_tenant_idx           on public.patients (tenant_id);
create index patients_tenant_name_idx      on public.patients (tenant_id, full_name);
create index professionals_tenant_idx      on public.professionals (tenant_id);
create index appointments_tenant_start_idx on public.appointments (tenant_id, scheduled_start);
create index appointments_patient_idx      on public.appointments (patient_id);
create index encounters_tenant_patient_idx on public.encounters (tenant_id, patient_id);
create index prescriptions_tenant_patient_idx on public.prescriptions (tenant_id, patient_id);
create index services_tenant_idx           on public.services (tenant_id);
create index invoices_tenant_status_idx    on public.invoices (tenant_id, status);
create index payments_tenant_paid_idx      on public.payments (tenant_id, paid_at);
create index expenses_tenant_spent_idx     on public.expenses (tenant_id, spent_at);
create index audit_logs_tenant_created_idx on public.audit_logs (tenant_id, created_at);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'tenants', 'profiles', 'patients', 'professionals', 'appointments',
    'encounters', 'prescriptions', 'services', 'invoices', 'expenses'
  ])
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'trg_' || t || '_updated_at', t
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Perfil automático ao criar usuário no Auth
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS — helpers
-- -----------------------------------------------------------------------------
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'superadmin'
  )
$$;

-- -----------------------------------------------------------------------------
-- RLS — tabelas com tenant_id direto
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles', 'patients', 'professionals', 'appointments', 'encounters',
    'prescriptions', 'services', 'invoices', 'payments', 'expenses',
    'expense_categories', 'tenant_modules', 'audit_logs'
  ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (tenant_id = public.current_tenant_id() or public.is_superadmin()) '
      || 'with check (tenant_id = public.current_tenant_id() or public.is_superadmin())',
      'tenant_isolation_' || t, t
    );
  end loop;
end;
$$;

-- Um usuário sempre pode ler/atualizar o próprio perfil
create policy profiles_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- -----------------------------------------------------------------------------
-- RLS — tabelas filhas (isoladas via tabela pai)
-- -----------------------------------------------------------------------------
alter table public.prescription_items enable row level security;
create policy tenant_isolation_prescription_items on public.prescription_items
  for all to authenticated
  using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_id
        and (p.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  )
  with check (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_id
        and (p.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  );

alter table public.invoice_items enable row level security;
create policy tenant_isolation_invoice_items on public.invoice_items
  for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (i.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (i.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  );

-- -----------------------------------------------------------------------------
-- RLS — tenants (leitura do próprio tenant; escrita só superadmin)
-- -----------------------------------------------------------------------------
alter table public.tenants enable row level security;

create policy tenants_select_own on public.tenants
  for select to authenticated
  using (id = public.current_tenant_id() or public.is_superadmin());

create policy tenants_manage_superadmin on public.tenants
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- -----------------------------------------------------------------------------
-- Grants (padrão Supabase: RLS é a barreira de segurança)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
