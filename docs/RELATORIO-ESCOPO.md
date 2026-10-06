# Torino HMS — Relatório de Escopo e Status

> Documento de onboarding e alinhamento. Une a **visão de negócio** e o **detalhamento
> técnico** do projeto num único lugar, para o time de desenvolvimento que vai atuar
> no produto.
>
> **Base de análise**: commit `35bff36` (`feat(fleet)`), branch `master`, árvore limpa.
> **Fontes**: `docs/PLANO.md`, `docs/INVENTARIO.md`, código em `src/` e migrations em
> `supabase/migrations/`.

---

## Parte I — Visão de Negócio

### 1. Sumário executivo

**Torino HMS** é um **SaaS multi-tenant de gestão hospitalar e clínica**, modular por
pacotes, voltado ao mercado brasileiro (pt-BR, LGPD desde o design). O produto nasceu
de um sistema de referência legado (CodeIgniter 3 / HMVC, 153 tabelas) e foi
**reescrito do zero** com stack moderna.

O modelo de negócio é o mesmo do produto de referência: uma clínica odontológica, uma
clínica médica e um hospital completo usam o **mesmo núcleo**, habilitando
**conjuntos de módulos diferentes** conforme o pacote contratado e os **limites**
(nº de pacientes e de profissionais).

**Estágio atual**: o MVP já é **funcional e navegável** — núcleo clínico, hospitalar,
farmácia/estoque, compras, financeiro, convênios, engenharia clínica, frota, Help Desk
e billing do SaaS estão implementados e persistidos em banco com RLS. Falta o
**acabamento comercial** (gateways de pagamento, configurações do tenant, RH,
comunicação) e a **profissionalização de engenharia** (testes, CI, observabilidade)
antes de escalar.

### 2. Proposta de valor

| Pilar | Descrição |
|---|---|
| **Modular por cliente** | Um só código; cada tenant liga só os módulos do seu pacote. |
| **Multi-tenant seguro** | Isolamento por `tenant_id` + Row Level Security no Postgres. |
| **Brasil-nativo** | pt-BR, fuso `America/Sao_Paulo`, região São Paulo, LGPD. |
| **Diferencial: Engenharia Clínica** | Gestão de equipamentos/ANVISA/tecnovigilância — **ausente** no sistema de referência. |
| **Diferencial: Help Desk + Base de Conhecimento** | Suporte interno e wiki, também ausentes no original. |
| **Baixo custo operacional** | Vercel + Supabase, regiões co-localizadas (latência baixa). |

### 3. Modelo comercial e pacotes

Cada tenant contrata um **pacote** que habilita módulos e aplica **limites**
(`patient_limit`, `professional_limit`). Módulos *add-on* podem ser ligados à parte.

| Pacote | Perfil de cliente | Limites |
|---|---|---|
| **Básico (Clínica)** | Clínica de pequeno porte | 500 pacientes / 5 profissionais |
| **Clínica+ / Odonto** | Clínica com odontologia/tratamentos | 2.000 / 20 |
| **Diagnóstico** | Laboratório e imagem | 5.000 / 30 |
| **Farmácia** | Farmácia clínica e estoque | ilimitado / 10 |
| **Hospital Completo** | Operação hospitalar | ilimitado / ilimitado |
| **Add-ons** | SMS, site, chat, IA, engenharia clínica | — |

- **Perfis (roles)**: `superadmin` (plataforma), `tenant_admin`, `professional`,
  `receptionist`, `nurse`, `pharmacist`, `laboratorist`, `accountant`, `patient`.
- **Cobrança (billing do SaaS)**: MVP com ativação manual + Pix; pós-MVP integração
  **Asaas** (Pix/boleto/assinatura recorrente). A gestão de assinaturas, faturas,
  pagamentos e cupons **já existe** na área de plataforma.
- **Região**: app em `gru1` (Vercel) e banco em `sa-east-1` (Supabase), co-localizados.

### 4. Escopo entregue (por domínio de negócio)

| Domínio | Valor para o cliente | Situação |
|---|---|---|
| Tenancy/SaaS (pacotes, módulos, limites, gating de menu) | Vender pacotes diferentes com um só produto | ✅ |
| Acesso/Auth (login, perfis, superadmin, tenant switcher) | Entrar e operar no tenant certo | ✅ |
| Painel (KPIs reais) | Visão gerencial do dia | ✅ |
| Pacientes (CRUD + soft delete) | Base do atendimento | ✅ |
| Profissionais + disponibilidade semanal/slots | Agenda funcionar | ✅ |
| Departamentos | Organização interna | ✅ |
| Agenda (status + detecção de conflito) | Evitar overbooking | ✅ |
| Atendimentos/Prontuário (vitais, CID, evolução, prescrição) | Registro clínico | ✅ |
| Leitos/Internação (categorias, internação, alta) | Operação hospitalar | ✅ |
| Exames Lab + Imagem (catálogo, pedidos, laudo por item) | Diagnóstico | ✅ |
| Laudos clínicos (nascimento/cirurgia/óbito/geral) | Documento legal | ✅ |
| Farmácia/Estoque (lotes, FEFO, alertas, valoração/ABC) | Controle de medicamentos | ✅ |
| Compras (OC, recebimento, contas a pagar) | Abastecimento | ✅ |
| Financeiro (faturas, recebimentos, despesas, catálogo de serviços) | Caixa | ✅ |
| Convênios (operadoras + vínculo no paciente) | Faturamento por plano | ✅ |
| Relatórios (faturamento, recebimentos, repasses, despesas) | Gestão | ✅ |
| Engenharia Clínica (equipamentos, OS, calibração, rastreabilidade, contratos, tecnovigilância, indicadores) | **Diferencial BR / ANVISA** | ✅ |
| Frota/Ambulância (veículos, motoristas, viagens, manutenção, combustível, documentos) | Operação e custos | ✅ |
| Help Desk + Base de Conhecimento | Suporte interno/SaaS | ✅ |
| Billing do SaaS (assinaturas, faturas, pagamentos, cupons) | Receita recorrente | ✅ |
| Equipe/convites por link | Onboarding de usuários | ✅ |

### 5. Lacunas de negócio (o que ainda não pode ser vendido como "completo")

1. **Pagamento online de faturas de paciente** (Pix/cartão) — hoje é registro manual.
2. **Catálogo CID / sintomas / tratamentos e planos terapêuticos** — campo CID é texto livre.
3. **Tela de Configurações do tenant** — **placeholder** (dados, pacote, preferências).
4. **Odontologia** — módulo vendido no pacote Clínica+, mas **sem implementação**
   (odontograma/planos).
5. **Emergência, centro cirúrgico, banco de sangue** — pacote Hospital Completo incompleto.
6. **RH (folha de pagamento, ponto, férias, feriados)** — pacote hospital não tem RH.
7. **Comunicação** (SMS/WhatsApp, e-mail com templates, chat, mural de avisos).
8. **Portal do paciente e site institucional** (Fase 2).
9. **IA** (análise de imagem / resumo do paciente) — add-on pago prometido.
10. **Conformidade LGPD de produção**: falta DPA, política de privacidade, auditoria
    com UI, backups/PITR (Supabase Pro).

---

## Parte II — Visão Técnica

### 6. Stack e arquitetura

| Camada | Tecnologia |
|---|---|
| App | **Next.js 16.3.6** (App Router, RSC), **React 19.2**, TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (Base UI) + lucide-react + sonner |
| Dados/Auth/Storage | **Supabase** (Postgres, Auth, RLS) |
| Deploy | Vercel (`gru1`) + Supabase (`sa-east-1`) |
| Repositório | GitHub `axyonsoftwarehouse/torino-hms` (público) |
| Validação | Zod |
| Fuso | `TZ=America/Sao_Paulo` fixado em `src/instrumentation.ts` |

> **Atenção (Next 16)**: o antigo `middleware.ts` virou `src/proxy.ts`
> (`export function proxy`). APIs, convenções e estrutura podem diferir do Next 15 —
> consulte `node_modules/next/dist/docs/` antes de escrever código. Ver `AGENTS.md`.

**Princípios de performance adotados**
- App e banco **na mesma região** (nunca cruzar continente por query).
- **Server Components acessando o banco direto** (`@/lib/supabase/server`), evitando
  waterfall cliente → API route → banco.
- RLS **empurrado ao Postgres** (filtra no banco, não na aplicação).
- Runtime Node (não Edge) para acesso a banco.

### 7. Estrutura do repositório

**GitHub**: `axyonsoftwarehouse/torino-hms` (público) — branch de produção `master`.

```
src/
  app/                    # rotas (App Router)
    app/                  # área autenticada (23 seções de rota)
    login/ signup/ invite/# autenticação e convite por token
  components/             # 99 arquivos; components/ui = 16 primitivos shadcn
  lib/
    supabase/             # clients: browser, server, proxy
    env.ts                # validação de env
    format.ts, validation.ts, payment-methods.ts, utils.ts
  modules/                # domínio por módulo (25 módulos)
    core/                 # catalog, navigation, access, session, auth-actions
    <dominio>/            # actions.ts / queries.ts / schema.ts (+ components)
  proxy.ts                # ex-middleware (Next 16)
  instrumentation.ts      # fixa TZ
supabase/
  migrations/             # 18 migrations versionadas
  seed.sql
docs/                     # PLANO.md, INVENTARIO.md, este relatório
```

### 8. Multi-tenancy, RLS e autorização

- **Schema compartilhado**; toda tabela de domínio tem `tenant_id uuid NOT NULL`.
- **RLS habilitado desde o núcleo** (`20260924000001_core.sql` e seguintes):
  políticas baseadas em `public.current_tenant_id()` (de `auth.uid()` →
  `profiles.tenant_id`) e `public.is_superadmin()`.
- Tabelas filhas (`invoice_items`, `prescription_items`) isoladas via tabela pai.
- **Superadmin em dois modos**: **Plataforma** (sem cookie `torino_active_tenant` →
  só Painel + Tenants) e **Tenant** (cookie setado via "Entrar" → menu clínico). O
  tenant ativo **vem do cookie**; não há auto-seleção (`src/modules/core/session.ts`).
- **RBAC dirigido por dados** (migrations `20261006000001`–`20261006000004`): matriz
  em `public.role_module_permissions` (papel × módulo → read/write), mapeamento de
  tabelas em `public.table_module` e aplicação por policies **RESTRICTIVE** por tabela
  (somam-se ao isolamento por tenant — nunca concedem). Helpers `can_read_module` /
  `can_write_module` / `is_staff`; trigger `trg_profiles_guard` impede escalada de
  `role`. O papel `patient` (portal — fase 2) não acessa dados do tenant. `anon` tem
  privilégios mínimos; RLS é habilitado automaticamente em tabelas novas (fail-closed).
- **Gating de menu por módulo** via `getEnabledModules` + `requiredModuleForPath`
  (`src/modules/core/access.ts`).
- **Limites de pacote** (`patient_limit`, `professional_limit`) no tenant.

### 9. Modelo de dados

**Números atuais**: **22 migrations**, **64 tabelas**. RLS habilitado em todas as
tabelas, com policies de isolamento por tenant + policies **RESTRICTIVE** de RBAC por
módulo (ver seção 8).

Schema redesenhado (não copiado do legado): PKs `uuid`, tipos corretos
(`timestamptz`, `numeric`, `boolean`, `jsonb`), FK explícitas, `created_at/updated_at`,
soft delete (`deleted_at`) onde aplicável, `tenant_id` + índices compostos.

Domínios cobertos: tenancy/RBAC, pacientes, profissionais/agenda, atendimentos/
prontuário, leitos, exames (lab+imagem), laudos, farmácia/estoque/compras, financeiro,
convênios, engenharia clínica, frota, billing do SaaS, suporte (tickets/wiki),
convites e cupons.

### 10. Dívida técnica e qualidade (crítico para o novo time)

| Item | Situação | Impacto |
|---|---|---|
| **Testes automatizados** | **0 arquivos de teste** (sem Vitest/Jest) | Alto risco de regressão |
| **CI/CD** | Sem pipeline; deploy automático via integração Git da Vercel (push na `master`) | Sem gate de qualidade |
| **Observabilidade** | Sem monitoramento/error tracking (Sentry etc.) | Baixa visibilidade de falhas |
| **Rate limiting** | Sem controle próprio; depende dos limites nativos do Supabase Auth | Médio para abuso de credenciais |
| **`/app/settings`** | Placeholder | Configuração do tenant indisponível |
| **Auditoria** | `audit_logs` existe, sem UI | Exigência LGPD |
| **PDF / impressão** | Laudos/relatórios sem PDF padronizado | Operação manual |
| **Paginação/busca** | Padrão só em Pacientes | UX inconsistente nas listas |
| **Tipos do banco** | Sem geração de tipos (`supabase gen types`) | Menos segurança de tipo |
| **i18n** | Sem base de tradução | Só pt-BR |

### 11. Backlog técnico priorizado

**P0 — Fundação de engenharia (antes de escalar o time)**
1. Configurar **Vitest** + testes de unidade em `modules/*/schema.ts` e `core/access`.
2. Configurar **CI** (lint + typecheck + test) no GitHub Actions.
3. **Error tracking** e logging estruturado.
4. Geração de **tipos do Supabase** (`database.types.ts`).

**P1 — Completar o produto vendável**
5. **Configurações do tenant** (`/app/settings`).
6. **Gateways de pagamento** (Pix/cartão) para faturas de paciente.
7. **Catálogo CID / sintomas / tratamentos / planos terapêuticos**.
8. **Segurança de login** (`login_attempts`, rate limit/bloqueio).
9. **E-mail com templates** e regras automáticas.

**P2 — Módulos do pacote Hospital Completo / Odonto**
10. **Odontologia** (odontograma, planos, imagens) — pacote já vendido.
11. **Emergência** e **Centro cirúrgico (OT)**.
12. **RH**: folha de pagamento, ponto, férias, feriados.
13. **Estoque genérico de suprimentos** + consumo por setor.
14. **Consumos vinculados ao leito** (`bed_medicine/service/diagnostic`).
15. **Banco de sangue/doadores**; **evolução diária**; ficha de antecedentes.
16. Cotações de fornecedores; categorização fiscal de pagamentos.

**P3 — Comunicação, conteúdo e diferenciais**
17. **SMS/WhatsApp + templates**; **chat interno**; **mural de avisos**.
18. **Portal do paciente** e **site institucional** (Fase 2).
19. **Arquivos/pastas** genéricos; laudos em **PDF/etiquetas**.
20. **IA** (imagem/resumo) como módulo pago.
21. **Billing Asaas**; afiliados; domínios personalizados; i18n; modo manutenção.
22. **MTBF** completo na Engenharia Clínica (exige intervalos de parada).

### 12. Roadmap por fases (consolidado)

| Fase | Foco | Status |
|---|---|---|
| **0 — Fundação** | Repo, lint, Supabase SP, Auth/RBAC/RLS, design system | ✅ |
| **1 — MVP Núcleo** | Tenants, usuários, pacientes, profissionais, agenda, prontuário, financeiro | ✅ |
| **2 — Portal & Presença** | Portal do paciente, site, auto-cadastro, notificações, i18n | ⛔ |
| **3 — Diagnóstico/Clínicos** | Lab, radiologia, farmácia/estoque, odontologia | 🟡 (lab/rad/farmácia ✅; odonto ⛔) |
| **4 — Hospitalar** | Leitos, emergência, ambulância, centro cirúrgico, RH, convênios | 🟡 (leitos/ambulância/convênios ✅) |
| **4.5 — Engenharia Clínica** | Equipamentos, manutenção, calibração, tecnovigilância | ✅ (MTBF pendente) |
| **5 — IA, Billing e Escala** | IA, Asaas, observabilidade, backups | ⛔ (billing manual ✅) |
| **6 — Lançamento comercial** | Vercel/Supabase Pro, LGPD, onboarding, suporte | ⛔ |

### 13. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Regressões por falta de testes/CI | P0 do backlog: Vitest + GitHub Actions |
| Latência por região divergente | Regra fixa: app `gru1` e banco `sa-east-1` |
| Waterfalls no front | Server Components + acesso direto ao banco |
| Free tier expirar/pausar | Upgrade para Pro no lançamento |
| Dado sensível sem backup | PITR/backups antes de vender (Supabase Pro) |
| Pacote vendido sem módulo pronto (odonto) | Completar Fase 3 antes de comercializar |
| Escopo modular crescer demais | Executar estritamente por fases; v1 = núcleo |
| LGPD incompleta | DPA, consentimento, auditoria com UI, retenção |

---

## Parte III — Onboarding do desenvolvedor

### 14. Comandos

```bash
npm install
cp .env.example .env.local   # credenciais do Supabase
npm run dev                  # http://localhost:3000
npm run build                # build de produção
npm run lint                 # ESLint (rodar antes de concluir mudanças)
```

Banco local:
```bash
npx supabase start
npx supabase db reset        # aplica migrations + seed
```

Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SITE_URL`, `TZ=America/Sao_Paulo`.

### 15. Convenções do projeto

- **Módulo = domínio**: cada pasta em `src/modules/<modulo>` expõe `actions.ts`,
  `queries.ts` e `schema.ts` (Zod). Rotas ficam em `src/app/app/<rota>`.
- **Server Components** acessam o banco direto (`@/lib/supabase/server`); evite API
  routes para leitura.
- **Nunca desabilite RLS**. Toda tabela de domínio tem `tenant_id`.
- **Menu é gated por módulo** (edite `core/navigation.ts` + `core/catalog.ts`).
- **Next 16**: middleware é `src/proxy.ts`; leia `node_modules/next/dist/docs/` antes
  de usar APIs que possam ter mudado.
- **Commits**: Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `docs: ...`).

### 16. Glossário

- **Tenant** — cliente (hospital/clínica) do SaaS.
- **Pacote** — conjunto de módulos + limites contratado.
- **Módulo** — funcionalidade habilitável por tenant.
- **RLS** — Row Level Security (isolamento no Postgres).
- **Modo Plataforma** — superadmin sem tenant ativo (gestão do SaaS).
- **FEFO** — First Expired, First Out (saída de lotes por validade).

---

_Referências: `docs/PLANO.md` (plano e decisões), `docs/INVENTARIO.md` (varredura
comparativa com o sistema de referência) e `AGENTS.md` (regras de trabalho)._
