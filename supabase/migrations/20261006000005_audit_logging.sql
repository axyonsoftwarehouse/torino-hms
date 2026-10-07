-- =============================================================================
-- Torino HMS — Auditoria (LGPD)
--
-- Trigger genérico que registra INSERT/UPDATE/DELETE em tabelas sensíveis em
-- public.audit_logs. O ator vem de auth.uid(); o tenant, da própria linha.
-- SECURITY DEFINER para conseguir gravar apesar da RLS (audit_logs é restrita).
-- =============================================================================

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row       jsonb;
  v_tenant    uuid;
  v_entity_id text;
  v_changes   jsonb;
begin
  if TG_OP = 'DELETE' then
    v_row := to_jsonb(OLD);
  else
    v_row := to_jsonb(NEW);
  end if;

  v_tenant := nullif(v_row ->> 'tenant_id', '')::uuid;
  if v_tenant is null and TG_TABLE_NAME = 'tenants' then
    v_tenant := nullif(v_row ->> 'id', '')::uuid;
  end if;

  v_entity_id := v_row ->> 'id';

  if TG_OP = 'UPDATE' then
    select jsonb_object_agg(d.key, d.value)
      into v_changes
      from (
        select key, value
        from jsonb_each(to_jsonb(NEW))
        where to_jsonb(NEW) -> key is distinct from to_jsonb(OLD) -> key
      ) as d;
  elsif TG_OP = 'INSERT' then
    v_changes := to_jsonb(NEW);
  else
    v_changes := to_jsonb(OLD);
  end if;

  insert into public.audit_logs (tenant_id, actor_id, action, entity, entity_id, metadata)
  values (
    v_tenant,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    v_entity_id,
    jsonb_build_object('changes', coalesce(v_changes, '{}'::jsonb))
  );

  return null;
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles', 'tenants', 'patients', 'professionals', 'departments',
    'appointments', 'professional_schedules', 'encounters', 'prescriptions',
    'medical_reports', 'exam_orders', 'medicines', 'medicine_batches',
    'stock_movements', 'suppliers', 'purchase_orders', 'invoices', 'invoice_items',
    'payments', 'expenses', 'services', 'insurance_companies', 'beds',
    'bed_assignments', 'equipment', 'maintenance_plans', 'service_orders',
    'fleet_vehicles', 'fleet_trips', 'tickets', 'invites', 'subscriptions',
    'saas_invoices', 'coupons'
  ])
  loop
    execute format('drop trigger if exists trg_audit on public.%I', t);
    execute format(
      'create trigger trg_audit after insert or update or delete on public.%I '
      || 'for each row execute function public.audit_row_change()',
      t
    );
  end loop;
end;
$$;
