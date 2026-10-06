-- =============================================================================
-- Torino HMS — RBAC (camada 2): matriz papel x módulo
--
-- Permissões dirigidas por dados, ajustáveis sem deploy de código:
--   public.table_module            -> mapeia cada tabela de domínio a um módulo
--   public.role_module_permissions -> matriz (role, module) => can_read/can_write
--
-- As policies RESTRICTIVE são ANDadas às permissivas de tenant já existentes:
-- nunca concedem acesso, só restringem. Assim o isolamento por tenant continua
-- valendo e o papel limita leitura/escrita por módulo.
--
-- Default: staff lê praticamente tudo do tenant (para a UI funcionar) e escreve
-- conforme o papel; 'patient' não tem nenhum módulo. Ajuste as permissões com
-- UPDATE/INSERT em role_module_permissions.
--
-- Substitui a policy "rbac_staff_only" da camada 1.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Configuração
-- -----------------------------------------------------------------------------
create table if not exists public.table_module (
  table_name text primary key,
  module     text not null
);

create table if not exists public.role_module_permissions (
  role      public.user_role not null,
  module    text not null,
  can_read  boolean not null default false,
  can_write boolean not null default false,
  primary key (role, module)
);

alter table public.table_module enable row level security;
alter table public.role_module_permissions enable row level security;

drop policy if exists config_read_table_module on public.table_module;
create policy config_read_table_module on public.table_module
  for select to authenticated using (true);

drop policy if exists config_read_role_module on public.role_module_permissions;
create policy config_read_role_module on public.role_module_permissions
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- Mapeamento tabela -> módulo
-- -----------------------------------------------------------------------------
insert into public.table_module (table_name, module) values
  ('patients', 'patient'),
  ('professionals', 'doctor'),
  ('departments', 'doctor'),
  ('appointments', 'appointment'),
  ('professional_schedules', 'appointment'),
  ('encounters', 'prescription'),
  ('prescriptions', 'prescription'),
  ('prescription_items', 'prescription'),
  ('medical_reports', 'prescription'),
  ('exam_categories', 'lab'),
  ('exam_tests', 'lab'),
  ('exam_orders', 'lab'),
  ('exam_order_items', 'lab'),
  ('medicines', 'pharmacy'),
  ('medicine_categories', 'pharmacy'),
  ('medicine_batches', 'pharmacy'),
  ('stock_movements', 'pharmacy'),
  ('suppliers', 'pharmacy'),
  ('purchase_orders', 'pharmacy'),
  ('purchase_order_items', 'pharmacy'),
  ('purchase_payments', 'pharmacy'),
  ('invoices', 'finance'),
  ('invoice_items', 'finance'),
  ('payments', 'finance'),
  ('services', 'finance'),
  ('expenses', 'finance'),
  ('expense_categories', 'finance'),
  ('insurance_companies', 'insurance'),
  ('beds', 'bed'),
  ('bed_categories', 'bed'),
  ('bed_assignments', 'bed'),
  ('bed_discharges', 'bed'),
  ('equipment', 'equipment'),
  ('equipment_categories', 'equipment'),
  ('equipment_contracts', 'equipment'),
  ('equipment_incidents', 'equipment'),
  ('equipment_loans', 'equipment'),
  ('maintenance_plans', 'equipment'),
  ('service_orders', 'equipment'),
  ('fleet_vehicles', 'ambulance'),
  ('fleet_drivers', 'ambulance'),
  ('fleet_trips', 'ambulance'),
  ('fleet_maintenance', 'ambulance'),
  ('fleet_fuel', 'ambulance'),
  ('fleet_documents', 'ambulance'),
  ('tickets', 'support'),
  ('ticket_departments', 'support'),
  ('ticket_messages', 'support'),
  ('kb_categories', 'support'),
  ('kb_articles', 'support'),
  ('invites', 'team'),
  ('audit_logs', 'audit'),
  ('saas_plans', 'platform'),
  ('subscriptions', 'platform'),
  ('saas_invoices', 'platform'),
  ('saas_invoice_items', 'platform'),
  ('saas_payments', 'platform'),
  ('saas_adjustments', 'platform'),
  ('coupons', 'platform'),
  ('tenant_modules', 'core'),
  ('tenants', 'core')
on conflict (table_name) do update set module = excluded.module;

-- -----------------------------------------------------------------------------
-- Matriz default (ajustável por SQL)
-- -----------------------------------------------------------------------------
insert into public.role_module_permissions (role, module, can_read, can_write)
select
  r.role,
  m.module,
  (m.module = any (r.read_modules)),
  (m.module = any (r.write_modules))
from (values
  (
    'tenant_admin'::public.user_role,
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core','team','audit','platform'],
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core','team','audit','platform']
  ),
  (
    'professional'::public.user_role,
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core'],
    array['patient','appointment','prescription','lab','bed','support']
  ),
  (
    'nurse'::public.user_role,
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core'],
    array['patient','appointment','prescription','bed','support']
  ),
  (
    'receptionist'::public.user_role,
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core'],
    array['patient','appointment','insurance','finance','support']
  ),
  (
    'pharmacist'::public.user_role,
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core'],
    array['pharmacy','support']
  ),
  (
    'laboratorist'::public.user_role,
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core'],
    array['lab','support']
  ),
  (
    'accountant'::public.user_role,
    array['patient','doctor','appointment','prescription','lab','pharmacy','finance','insurance','bed','equipment','ambulance','support','core'],
    array['finance','insurance','support']
  ),
  (
    'patient'::public.user_role,
    array[]::text[],
    array[]::text[]
  )
) as r(role, read_modules, write_modules)
cross join lateral (
  select distinct unnest(r.read_modules || r.write_modules) as module
) as m
on conflict (role, module) do update
  set can_read = excluded.can_read, can_write = excluded.can_write;

-- -----------------------------------------------------------------------------
-- Helpers de autorização
-- -----------------------------------------------------------------------------
create or replace function public.can_read_module(p_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin()
    or exists (
      select 1
      from public.profiles p
      join public.role_module_permissions rp
        on rp.role = p.role and rp.module = p_module
      where p.id = auth.uid()
        and p.status = 'active'
        and rp.can_read
    )
$$;

create or replace function public.can_write_module(p_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin()
    or exists (
      select 1
      from public.profiles p
      join public.role_module_permissions rp
        on rp.role = p.role and rp.module = p_module
      where p.id = auth.uid()
        and p.status = 'active'
        and rp.can_write
    )
$$;

-- -----------------------------------------------------------------------------
-- Aplicação: policies RESTRICTIVE por tabela
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  m text;
begin
  for t, m in select table_name, module from public.table_module
  loop
    execute format('drop policy if exists %I on public.%I', 'rbac_staff_only', t);
    execute format('drop policy if exists %I on public.%I', 'rbac_read', t);
    execute format('drop policy if exists %I on public.%I', 'rbac_insert', t);
    execute format('drop policy if exists %I on public.%I', 'rbac_update', t);
    execute format('drop policy if exists %I on public.%I', 'rbac_delete', t);

    execute format(
      'create policy %I on public.%I as restrictive for select to authenticated '
      || 'using (public.can_read_module(%L))',
      'rbac_read', t, m
    );
    execute format(
      'create policy %I on public.%I as restrictive for insert to authenticated '
      || 'with check (public.can_write_module(%L))',
      'rbac_insert', t, m
    );
    execute format(
      'create policy %I on public.%I as restrictive for update to authenticated '
      || 'using (public.can_write_module(%L)) with check (public.can_write_module(%L))',
      'rbac_update', t, m, m
    );
    execute format(
      'create policy %I on public.%I as restrictive for delete to authenticated '
      || 'using (public.can_write_module(%L))',
      'rbac_delete', t, m
    );
  end loop;
end;
$$;
