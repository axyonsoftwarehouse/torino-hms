-- =============================================================================
-- Torino HMS — Diagnóstico (Laboratório + Radiologia)
-- Inspirado em lab/lab_category (fluxo com coleta, resultado e entrega) e em
-- radiology_categories/radiology_tests/radiology_orders/radiology_order_items
-- (catálogo, urgência, status e valores), unificados.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'exam_kind') then
    create type public.exam_kind as enum ('lab', 'imaging');
  end if;
  if not exists (select 1 from pg_type where typname = 'exam_urgency') then
    create type public.exam_urgency as enum ('routine', 'urgent', 'stat');
  end if;
  if not exists (select 1 from pg_type where typname = 'exam_order_status') then
    create type public.exam_order_status as enum (
      'pending', 'collected', 'in_progress', 'completed', 'delivered', 'canceled'
    );
  end if;
end;
$$;

create table if not exists public.exam_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  kind        public.exam_kind not null default 'lab',
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.exam_tests (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null references public.tenants(id) on delete cascade,
  category_id               uuid references public.exam_categories(id) on delete set null,
  name                      text not null,
  description               text,
  price_cents               integer not null default 0,
  duration_minutes          integer,
  preparation_instructions  text,
  reference_value           text,
  active                    boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table if not exists public.exam_orders (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  order_number   text not null,
  patient_id     uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  encounter_id   uuid references public.encounters(id) on delete set null,
  kind           public.exam_kind not null default 'lab',
  urgency        public.exam_urgency not null default 'routine',
  status         public.exam_order_status not null default 'pending',
  order_date     timestamptz not null default now(),
  clinical_notes text,
  total_cents    integer not null default 0,
  delivered_at   timestamptz,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.exam_order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.exam_orders(id) on delete cascade,
  test_id        uuid references public.exam_tests(id) on delete set null,
  test_name      text not null,
  price_cents    integer not null default 0,
  quantity       integer not null default 1,
  subtotal_cents integer not null default 0,
  status         text not null default 'pending',
  result         text,
  result_date    timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists exam_categories_tenant_idx on public.exam_categories (tenant_id, kind);
create index if not exists exam_tests_tenant_idx      on public.exam_tests (tenant_id, name);
create index if not exists exam_orders_lookup_idx     on public.exam_orders (tenant_id, status, order_date desc);
create index if not exists exam_order_items_order_idx on public.exam_order_items (order_id);

-- RLS
do $$
declare
  t text;
begin
  for t in select unnest(array['exam_categories', 'exam_tests', 'exam_orders'])
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

alter table public.exam_order_items enable row level security;
drop policy if exists tenant_isolation_exam_order_items on public.exam_order_items;
create policy tenant_isolation_exam_order_items on public.exam_order_items
  for all to authenticated
  using (
    exists (
      select 1 from public.exam_orders o
      where o.id = order_id
        and (o.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  )
  with check (
    exists (
      select 1 from public.exam_orders o
      where o.id = order_id
        and (o.tenant_id = public.current_tenant_id() or public.is_superadmin())
    )
  );

-- updated_at
do $$
declare
  t text;
begin
  for t in select unnest(array['exam_categories', 'exam_tests', 'exam_orders'])
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
