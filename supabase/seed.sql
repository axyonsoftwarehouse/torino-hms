-- =============================================================================
-- Torino HMS — Seed de desenvolvimento
-- Cria um tenant de demonstração (Clínica Demo) com pacote "clínica".
--
-- Observação: usuários são criados via Supabase Auth. Após criar um usuário,
-- atualize o perfil dele para o tenant demo, por exemplo:
--
--   update public.profiles
--      set tenant_id = (select id from public.tenants where slug = 'clinica-demo'),
--          role = 'tenant_admin'
--    where email = 'seu-email@exemplo.com';
-- =============================================================================

insert into public.tenants
  (name, slug, email, phone, package_key, patient_limit, professional_limit, status)
values
  ('Clínica Demo', 'clinica-demo', 'contato@demo.torino.local', '+55 11 0000-0000', 'clinica', 2000, 20, 'active')
on conflict (slug) do nothing;

-- Módulos do pacote "clínica"
insert into public.tenant_modules (tenant_id, module_key)
select t.id, m.module_key
from public.tenants t
cross join (
  values
    ('patient'), ('doctor'), ('appointment'), ('prescription'), ('diagnosis'),
    ('treatment'), ('dental'), ('inventory'), ('finance'), ('report')
) as m(module_key)
where t.slug = 'clinica-demo'
on conflict do nothing;

-- Serviços de exemplo
insert into public.services (tenant_id, name, category, price_cents)
select t.id, s.name, s.category, s.price_cents
from public.tenants t
cross join (
  values
    ('Consulta clínica', 'Consultas', 25000),
    ('Consulta odontológica', 'Odontologia', 20000),
    ('Limpeza dental', 'Odontologia', 15000),
    ('Retorno', 'Consultas', 0)
) as s(name, category, price_cents)
where t.slug = 'clinica-demo';

-- Categorias de despesa de exemplo
insert into public.expense_categories (tenant_id, name)
select t.id, c.name
from public.tenants t
cross join (
  values ('Aluguel'), ('Materiais'), ('Folha de pagamento'), ('Marketing')
) as c(name)
where t.slug = 'clinica-demo';
