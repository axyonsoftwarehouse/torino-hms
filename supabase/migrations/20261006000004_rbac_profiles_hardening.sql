-- =============================================================================
-- Torino HMS — RBAC (camada 3) + hardening de privilégios
--
--  1. profiles entra no RBAC de leitura: usuário lê o próprio perfil; staff lê
--     perfis do seu tenant; superadmin lê todos. O papel 'patient' deixa de ler
--     perfis de terceiros (mantém a leitura do próprio perfil).
--  2. Reduz privilégios do papel 'anon' (defesa em profundidade): sem grants
--     amplos em tabelas/sequences. RPCs públicas (ex.: invite_by_token) seguem
--     funcionando via EXECUTE concedido explicitamente.
--  3. Event trigger que habilita RLS automaticamente em tabelas novas (fail-closed:
--     sem policies, o acesso fica negado até que policies sejam criadas).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RBAC de leitura em profiles
-- -----------------------------------------------------------------------------
drop policy if exists rbac_read on public.profiles;
create policy rbac_read on public.profiles
  as restrictive for select to authenticated
  using (
    id = auth.uid()
    or public.is_superadmin()
    or (public.is_staff() and tenant_id = public.current_tenant_id())
  );

-- -----------------------------------------------------------------------------
-- 2. Privilégios mínimos para anon
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- A página pública de convite usa apenas a RPC definer invite_by_token;
-- garante o EXECUTE mesmo após ajustes de privilégio.
grant execute on function public.invite_by_token(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Auto-RLS em tabelas novas (fail-closed)
-- -----------------------------------------------------------------------------
create or replace function public.enable_rls_on_new_tables()
returns event_trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  loop
    if rec.schema_name = 'public' then
      execute format('alter table %s enable row level security', rec.object_identity);
    end if;
  end loop;
end;
$$;

drop event trigger if exists enable_rls_on_new_tables;
create event trigger enable_rls_on_new_tables
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.enable_rls_on_new_tables();
