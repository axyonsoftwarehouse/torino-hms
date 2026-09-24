-- =============================================================================
-- Torino HMS — Engenharia Clínica (Fase 2)
-- Rastreabilidade de entrega/recolhimento de equipamentos nos setores
-- (empréstimos), contratos, certificados de calibração e tecnovigilância.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'equipment_loan_status') then
    create type public.equipment_loan_status as enum ('loaned', 'returned');
  end if;
  if not exists (select 1 from pg_type where typname = 'equipment_contract_type') then
    create type public.equipment_contract_type as enum ('warranty', 'maintenance', 'rental', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'incident_severity') then
    create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
  end if;
end;
$$;

-- Empréstimos / movimentações rastreáveis
create table if not exists public.equipment_loans (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  equipment_id          uuid not null references public.equipment(id) on delete cascade,
  sector                text not null,
  patient_reference     text,
  delivered_at          timestamptz not null default now(),
  delivered_by          uuid references public.profiles(id) on delete set null,
  received_by           text,
  returned_at           timestamptz,
  returned_to           text,
  condition_out         text,
  condition_in          text,
  isolation             boolean not null default false,
  infection_notes       text,
  disinfection_required boolean not null default false,
  disinfection_done     boolean not null default false,
  disinfection_at       timestamptz,
  notes                 text,
  status                public.equipment_loan_status not null default 'loaned',
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Contratos (garantia / manutenção / locação)
create table if not exists public.equipment_contracts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  type         public.equipment_contract_type not null default 'maintenance',
  provider     text,
  start_date   date,
  end_date     date,
  value_cents  integer not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Tecnovigilância (eventos adversos / queixas técnicas — base NOTIVISA)
create table if not exists public.equipment_incidents (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  equipment_id          uuid not null references public.equipment(id) on delete cascade,
  occurred_at           date not null default current_date,
  description           text not null,
  severity              public.incident_severity not null default 'medium',
  anvisa_notified       boolean not null default false,
  notification_number   text,
  status                text not null default 'open',
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Certificado de calibração na ordem de serviço
alter table public.service_orders
  add column if not exists certificate_number text,
  add column if not exists certificate_expires_at date;

create index if not exists equipment_loans_lookup_idx on public.equipment_loans (tenant_id, status, delivered_at desc);
create index if not exists equipment_loans_equipment_idx on public.equipment_loans (equipment_id);
create index if not exists equipment_contracts_equipment_idx on public.equipment_contracts (equipment_id);
create index if not exists equipment_incidents_equipment_idx on public.equipment_incidents (equipment_id);

do $$
declare
  t text;
begin
  for t in select unnest(array['equipment_loans', 'equipment_contracts', 'equipment_incidents'])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'tenant_isolation_' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (tenant_id = public.current_tenant_id() or public.is_superadmin()) '
      || 'with check (tenant_id = public.current_tenant_id() or public.is_superadmin())',
      'tenant_isolation_' || t, t
    );
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
