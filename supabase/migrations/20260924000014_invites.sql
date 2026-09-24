-- =============================================================================
-- Torino HMS — Convites de usuário (team invitations)
-- Inspirado no fluxo de criação de usuários/empresas do módulo Perfect SaaS.
-- Abordagem sem service role/SMTP: gera token; o convidado aceita via link.
-- =============================================================================

create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  email      text not null,
  role       public.user_role not null default 'professional',
  token      text not null unique,
  status     text not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invites_tenant_idx on public.invites (tenant_id, status);
create index if not exists invites_token_idx on public.invites (token);

alter table public.invites enable row level security;

drop policy if exists tenant_isolation_invites on public.invites;
create policy tenant_isolation_invites on public.invites
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superadmin())
  with check (tenant_id = public.current_tenant_id() or public.is_superadmin());

-- Leitura pública do convite pelo token (para a página de aceite)
create or replace function public.invite_by_token(p_token text)
returns table (email text, role public.user_role, tenant_name text, status text)
language sql
security definer
set search_path = public
as $$
  select i.email, i.role, t.name, i.status
  from public.invites i
  join public.tenants t on t.id = i.tenant_id
  where i.token = p_token
    and (i.expires_at is null or i.expires_at > now())
  limit 1
$$;

-- Aceite: vincula o usuário autenticado ao tenant com o papel do convite
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
begin
  select * into v_invite
  from public.invites
  where token = p_token
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  limit 1;

  if not found then
    return null;
  end if;

  update public.profiles
  set tenant_id = v_invite.tenant_id, role = v_invite.role, status = 'active'
  where id = auth.uid();

  update public.invites set status = 'accepted' where id = v_invite.id;

  return v_invite.tenant_id;
end;
$$;

grant execute on function public.invite_by_token(text) to anon, authenticated;
grant execute on function public.accept_invite(text) to authenticated;

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
