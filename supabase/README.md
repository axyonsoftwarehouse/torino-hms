# Supabase — Torino HMS

Banco, autenticação, storage e RLS do Torino HMS.

## Estrutura

```
supabase/
  migrations/
    20260924000001_core.sql   # Núcleo da Fase 1 (tenancy, RBAC, pacientes, agenda, financeiro)
  seed.sql                    # Tenant de demonstração para desenvolvimento
```

## Região

Projeto Supabase deve ser criado em **São Paulo (`sa-east-1`)** para ficar
co-localizado com o deploy (Vercel `gru1`). Ver `docs/PLANO.md` §3.2.

## Fluxo local

```bash
# 1. Instalar a CLI do Supabase (uma vez)
npm install --save-dev supabase

# 2. Inicializar a configuração local (gera config.toml)
npx supabase init

# 3. Subir o stack local (Docker)
npx supabase start

# 4. Aplicar migrations + seed
npx supabase db reset
```

## Fluxo no projeto remoto

```bash
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

## Modelo de isolamento

- Toda tabela de domínio tem `tenant_id uuid`.
- **RLS habilitado** com policies baseadas em `public.current_tenant_id()`
  (derivado de `auth.uid()` → `profiles.tenant_id`) e `public.is_superadmin()`.
- Tabelas filhas (`invoice_items`, `prescription_items`) são isoladas via a
  tabela pai.
- **Atenção**: a barreira de segurança é o RLS. O `grant` amplo para `anon`/
  `authenticated` segue o padrão do Supabase, mas **nunca** desabilite RLS em
  tabelas de domínio.
