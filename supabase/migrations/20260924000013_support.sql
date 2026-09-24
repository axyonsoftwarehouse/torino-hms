-- =============================================================================
-- Torino HMS — Help Desk + Base de Conhecimento
-- Inspirado no HelpDesk Pro (tickets, departamentos, SLA) e na Wiki
-- (livros/categorias -> artigos com slug, visualizações e publicação).
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum (
      'open', 'in_progress', 'pending', 'resolved', 'closed'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'ticket_priority') then
    create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
  end if;
end;
$$;

create table if not exists public.ticket_departments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  number        text not null,
  subject       text not null,
  description   text,
  status        public.ticket_status not null default 'open',
  priority      public.ticket_priority not null default 'normal',
  department_id uuid references public.ticket_departments(id) on delete set null,
  requester_id  uuid references public.profiles(id) on delete set null,
  assignee_id   uuid references public.profiles(id) on delete set null,
  due_date      date,
  closed_at     timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null,
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Base de conhecimento
create table if not exists public.kb_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.kb_articles (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.kb_categories(id) on delete set null,
  title       text not null,
  slug        text not null,
  content     text,
  published   boolean not null default false,
  views       integer not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tickets_lookup_idx        on public.tickets (tenant_id, status, created_at desc);
create index if not exists tickets_department_idx    on public.tickets (department_id);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);
create index if not exists kb_articles_lookup_idx     on public.kb_articles (tenant_id, published);
create unique index if not exists kb_articles_slug_uidx on public.kb_articles (tenant_id, slug);

-- RLS
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'ticket_departments', 'tickets', 'ticket_messages', 'kb_categories', 'kb_articles'
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
  end loop;
end;
$$;

-- updated_at
do $$
declare
  t text;
begin
  for t in select unnest(array['ticket_departments', 'tickets', 'kb_categories', 'kb_articles'])
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
