# Torino HMS

SaaS multi-tenant de gestão hospitalar e clínica — modular por pacotes.
Inspirado no modelo do sistema de referência (HMS multi-hospital), reescrito do zero.

- **Stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase.
- **Deploy**: Vercel (`gru1`) + Supabase (`sa-east-1`), co-localizados em São Paulo.
- **Plano completo**: [`docs/PLANO.md`](./docs/PLANO.md).

## Estrutura

```
src/
  app/                 # rotas (App Router)
    app/               # área autenticada (painel)
    login/             # autenticação
  components/          # componentes compartilhados + shadcn/ui
  lib/
    supabase/          # clientes (browser, server, proxy)
    env.ts             # validação de variáveis de ambiente
  modules/             # domínio por módulo (catálogo, navegação, futuros services)
    core/
supabase/
  migrations/          # schema versionado (RLS multi-tenant)
  seed.sql
docs/
  PLANO.md
```

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do Supabase
npm run dev                  # http://localhost:3000
```

Variáveis de ambiente (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Banco de dados

Ver [`supabase/README.md`](./supabase/README.md). Resumo:

```bash
npx supabase init
npx supabase start
npx supabase db reset    # aplica migrations + seed
```

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run start    # servir o build
npm run lint     # ESLint
```

## Deploy

- **Produção**: https://torino-hms.vercel.app (Vercel Hobby, região `gru1`).
- **Deploy automático**: o repositório GitHub está conectado — cada `git push` na `master` publica.
- **Região/fuso**: `vercel.json` fixa `gru1`; o fuso `America/Sao_Paulo` é definido em
  `src/instrumentation.ts` (o nome `TZ` é reservado como env var na Vercel).
- Configure as variáveis de ambiente em Production/Preview na Vercel.

## Status

Módulos implementados: **Núcleo** (tenants/pacotes/módulos, auth, pacientes, profissionais,
agenda, atendimentos/prescrição); **hospitalar** (leitos, exames, laudos, **engenharia clínica**
com rastreabilidade de entrega/recolhimento por setor, contratos, tecnovigilância e indicadores);
**farmácia/estoque**; **compras**; **financeiro**; **convênios**; **relatórios**;
**Help Desk + Base de conhecimento**; **Billing do SaaS** (assinaturas, faturas, pagamentos,
cupons) e **Equipe/convites**. Detalhes em [`docs/INVENTARIO.md`](./docs/INVENTARIO.md) e
[`docs/PLANO.md`](./docs/PLANO.md).
