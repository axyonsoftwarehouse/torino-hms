-- =============================================================================
-- Torino HMS — Security hardening
--  - Corrige escalada de privilégio em public.profiles (RLS "for all" deixava
--    qualquer membro do tenant alterar role/tenant_id/status de qualquer perfil).
--  - accept_invite passa a exigir que o e-mail do usuário autenticado case com o
--    convite e que o tenant esteja ativo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: papel do usuário autenticado
-- -----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- -----------------------------------------------------------------------------
-- RLS de profiles: separar leitura, auto-edição e administração
-- -----------------------------------------------------------------------------
-- Remove a policy ampla herdada do loop de tenant_isolation
drop policy if exists tenant_isolation_profiles on public.profiles;

-- Leitura: próprio perfil, membros do mesmo tenant, superadmin
drop policy if exists profiles_select_tenant on public.profiles;
create policy profiles_select_tenant on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or tenant_id = public.current_tenant_id()
    or public.is_superadmin()
  );

-- Auto-edição: usuário edita apenas o próprio perfil (colunas sensíveis ficam
-- protegidas pelo trigger abaixo).
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Administração: tenant_admin do tenant ou superadmin
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (
    public.is_superadmin()
    or (
      public.current_user_role() = 'tenant_admin'
      and tenant_id = public.current_tenant_id()
    )
  )
  with check (
    public.is_superadmin()
    or (
      public.current_user_role() = 'tenant_admin'
      and tenant_id = public.current_tenant_id()
    )
  );

-- -----------------------------------------------------------------------------
-- Guarda: impede que usuários comuns elevem a própria role/tenant/status.
-- Funções SECURITY DEFINER (ex.: accept_invite) executam com outro current_user
-- e são dispensadas da checagem.
-- -----------------------------------------------------------------------------
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.tenant_id is distinct from old.tenant_id
     or new.status is distinct from old.status then

    if public.is_superadmin() then
      return new;
    end if;

    if public.current_user_role() = 'tenant_admin'
       and old.tenant_id = public.current_tenant_id()
       and new.tenant_id is not distinct from old.tenant_id
       and new.role <> 'superadmin' then
      return new;
    end if;

    raise exception 'Alteracao de papel, tenant ou status nao permitida'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- -----------------------------------------------------------------------------
-- accept_invite: valida e-mail do convidado e tenant ativo
-- -----------------------------------------------------------------------------
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_email  text;
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

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' or v_email <> lower(v_invite.email) then
    return null;
  end if;

  if not exists (
    select 1 from public.tenants
    where id = v_invite.tenant_id and status = 'active'
  ) then
    return null;
  end if;

  update public.profiles
  set tenant_id = v_invite.tenant_id, role = v_invite.role, status = 'active'
  where id = auth.uid();

  update public.invites set status = 'accepted' where id = v_invite.id;

  return v_invite.tenant_id;
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;
