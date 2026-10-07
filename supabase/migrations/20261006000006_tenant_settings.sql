-- =============================================================================
-- Torino HMS — Configurações do tenant
--
-- RPC para o tenant_admin editar os próprios dados cadastrais (e superadmin
-- qualquer tenant), sem expor colunas sensíveis (package_key, limites, status).
-- A alteração também é registrada pela trigger de auditoria.
-- =============================================================================

create or replace function public.update_own_tenant(
  p_tenant_id uuid,
  p_name      text,
  p_email     text,
  p_phone     text,
  p_document  text,
  p_address   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    if public.current_user_role() <> 'tenant_admin'
       or public.current_tenant_id() is distinct from p_tenant_id then
      raise exception 'Sem permissao para editar este tenant' using errcode = '42501';
    end if;
  end if;

  update public.tenants
     set name     = trim(p_name),
         email    = nullif(trim(p_email), ''),
         phone    = nullif(trim(p_phone), ''),
         document = nullif(trim(p_document), ''),
         address  = nullif(trim(p_address), '')
   where id = p_tenant_id;

  if not found then
    raise exception 'Tenant nao encontrado' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.update_own_tenant(uuid, text, text, text, text, text)
  to authenticated;
