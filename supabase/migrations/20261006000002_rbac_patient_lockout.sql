-- =============================================================================
-- Torino HMS — RBAC (camada 1): exclusão do papel "patient" dos dados do tenant
--
-- As policies existentes isolam por tenant, mas não checam papel. Adicionamos uma
-- policy RESTRICTIVE (somada/ANDada às permissivas) em cada tabela de domínio,
-- exigindo que o usuário seja da equipe (staff) ou superadmin. Com isso, usuários
-- com role 'patient' (portal do paciente — fase 2, ainda não implementado) ficam
-- sem acesso a qualquer dado do tenant, sem alterar o comportamento dos demais papéis.
--
-- Refinamento por papel (matriz papel x módulo) fica como próximo passo.
-- =============================================================================

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role <> 'patient'
  )
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'appointments', 'audit_logs', 'bed_assignments', 'bed_categories',
    'bed_discharges', 'beds', 'coupons', 'departments', 'encounters', 'equipment',
    'equipment_categories', 'equipment_contracts', 'equipment_incidents',
    'equipment_loans', 'exam_categories', 'exam_order_items', 'exam_orders',
    'exam_tests', 'expense_categories', 'expenses', 'fleet_documents',
    'fleet_drivers', 'fleet_fuel', 'fleet_maintenance', 'fleet_trips',
    'fleet_vehicles', 'insurance_companies', 'invites', 'invoice_items',
    'invoices', 'kb_articles', 'kb_categories', 'maintenance_plans',
    'medical_reports', 'medicine_batches', 'medicine_categories', 'medicines',
    'patients', 'payments', 'prescription_items', 'prescriptions',
    'professional_schedules', 'professionals', 'purchase_order_items',
    'purchase_orders', 'purchase_payments', 'saas_adjustments',
    'saas_invoice_items', 'saas_invoices', 'saas_payments', 'saas_plans',
    'service_orders', 'services', 'stock_movements', 'subscriptions',
    'suppliers', 'tenant_modules', 'tenants', 'ticket_departments',
    'ticket_messages', 'tickets'
  ])
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      'rbac_staff_only', t
    );
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated '
      || 'using (public.is_staff() or public.is_superadmin()) '
      || 'with check (public.is_staff() or public.is_superadmin())',
      'rbac_staff_only', t
    );
  end loop;
end;
$$;
