# Torino HMS — Plano de Projeto

> Documento de planejamento consolidado. Projeto **inspirado** no sistema de referência
> `Multi Hospital 19 April 2026` (CodeIgniter 3 / HMVC / Ion Auth / AdminLTE), mas
> **reescrito do zero** com stack moderna.

---

## 1. Visão

**Torino HMS** é um **SaaS multi-tenant** de gestão hospitalar/clínica, modular por
pacotes, voltado inicialmente ao **mercado brasileiro (pt-BR)**.

O diferencial do modelo é a **modularidade por tipo de cliente**: uma clínica
odontológica, uma clínica médica e um hospital completo usam o **mesmo núcleo**, mas
habilitam **conjuntos de módulos diferentes** conforme o pacote contratado — exatamente
como o `hospital.module` (CSV de módulos) do projeto de referência.

O sistema de referência já é, na prática, um SaaS modular: a tabela `hospital` possui
`package`, `p_limit` (limite de pacientes), `d_limit` (limite de médicos) e `module`.
Mantemos esse modelo de negócio, refazendo a engenharia.

---

## 2. Decisões fechadas (decision log)

| # | Decisão | Escolha |
|---|---------|---------|
| Q1 | Domínio / escopo | HMS modular; começa com núcleo e escala por módulos |
| Q2/Q7 | Stack | **Next.js 15 (App Router, TS) + Supabase + Tailwind + shadcn/ui** |
| Q3 | Multi-tenancy | **Sim**, multi-tenant como o original |
| Q4 | Natureza | **Produto comercial SaaS** |
| Q5 | Entregável inicial | Documento de planejamento (`docs/PLANO.md`) + fases |
| Q6 | Contexto | Dev solo, prazo aberto, serviço gerenciado barato |
| Q7.1 | Runtime/deploy | **Vercel serverless + Supabase Free no MVP** → Pro no lançamento |
| Q7.2 | Região | **São Paulo** (`gru1` / `sa-east-1`), co-localizado |
| Q8 | Isolamento | **Schema compartilhado + `tenant_id` + RLS** |
| Q9 | Dados | **Redesenhar** o schema com base nas 153 tabelas de referência (não copiar) |
| Q10 | Módulos | v1 = Núcleo; pacote → conjunto de módulos + limites |
| Q11 | Perfis | superadmin, admin do tenant, profissional, recepção, paciente |
| Q12 | Mercado | Brasil, pt-BR, **LGPD desde o design** |
| Q13 | Billing | Manual/Pix no MVP → **Asaas** pós-MVP |
| Q14 | Integrações | v1 só **e-mail transacional**; SMS/WhatsApp e IA depois |
| Q15 | Portal do paciente / site | Fase 2 |
| Q16 | Cadastro de paciente | Criado pela recepção no MVP |
| Q17 | Nome | **Torino HMS** |
| Q18 | Local | `C:\Users\werne\WebstormProjects\Torino-HMS` |
| Q19 | Escopo imediato | Apenas este plano; scaffold no passo seguinte |

---

## 3. Arquitetura

### 3.1 Stack

- **App**: Next.js 15 (App Router, React Server Components, TypeScript).
- **UI**: Tailwind CSS + shadcn/ui (dashboard estilo AdminLTE modernizado).
- **Dados/Auth/Storage**: Supabase (Postgres, Auth, RLS, Storage, Realtime, Edge Functions).
- **Deploy**: Vercel (serverless) no início; região `gru1`.
- **Jobs assíncronos**: Supabase Edge Functions / cron (SMS, e-mail, IA) — sempre fora do
  caminho da requisição.

### 3.2 Arquitetura de performance (crítica)

A lentidão percebida em projetos Next costuma ser **arquitetural**, não do framework:

1. **Co-localização de região** — app (`gru1`) e banco (`sa-east-1`) na **mesma região**.
   Regra de projeto: nunca cruzar continente por query.
2. **Server Components + acesso direto ao banco** (Supabase server client), **sem** API
   route intermediária para leitura. Elimina waterfalls cliente→API→banco.
3. **Connection pooling** (Supavisor) — serverless abre muitas conexões.
4. **Cache em camadas** — `fetch` cache, `unstable_cache`, `revalidateTag`, React `cache()`,
   ISR em páginas de leitura.
5. **Índices em `tenant_id`** + **RLS empurrado ao banco** (filtra no Postgres).
6. **Jobs pesados fora do request** (e-mail, IA, relatórios) via queue/worker.
7. **Runtime Node (não Edge)** para acesso a banco.
8. Se cold start/throughput incomodarem: mover o app para processo **long-running**
   (Railway/Fly/Docker) mantendo Supabase — mesma DX, perfil de latência de Laravel.

> Referência de latência: para um HMS, o gargalo é **latência de query e região**, não
> throughput. Corrigidos região + waterfall + cache, o Next empata ou supera o Laravel.

### 3.3 Multi-tenancy e isolamento

- **Schema compartilhado**, toda tabela de domínio possui `tenant_id uuid NOT NULL`.
- **RLS (Row Level Security)** habilitado em todas as tabelas: políticas baseadas no
  `tenant_id` do JWT do usuário.
- `superadmin` (dono do SaaS) tem papel global; usuários comuns enxergam apenas seu tenant.
- **Limites por pacote**: `p_limit` (pacientes) e `d_limit` (profissionais) validados no
  banco (constraint/trigger) e na aplicação.

---

## 4. Modelo de dados

### 4.1 Princípios de redesenho

O schema original usa `varchar(100)`/`varchar(1000)` para **tudo** (inclusive IDs, datas e
valores) e **não possui FKs** nem `created_at`/soft delete. **Não copiamos.** Redesenhamos:

- PKs `uuid` (ou `bigint` identity).
- Tipos corretos (`timestamptz`, `numeric`, `boolean`, `text`, `jsonb` quando couber).
- **Foreign keys** explícitas e `ON DELETE` coerente.
- `created_at`, `updated_at`, `deleted_at` (soft delete) padrão.
- `tenant_id` em toda tabela de domínio + índice composto `(tenant_id, ...)`.

### 4.2 Domínios funcionais (derivados das 153 tabelas de referência)

- **Tenancy & Acesso**: hospital/tenant, usuários, grupos/perfis, permissões, login attempts.
- **Pacientes**: paciente, histórico médico, sinais vitais, progresso, depósito do paciente.
- **Profissionais**: médico, enfermeiro, dentista, farmacêutico, laboratorista, recepção,
  contador, folha de pagamento, presença, férias.
- **Agenda & Atendimento**: consulta, visita médica, plantão/slots, fila, emergência.
- **Prontuário & Clínico**: prescrição, diagnóstico, sintoma, tratamento, planos de tratamento,
  odontograma (dental), imagens.
- **Diagnóstico**: laboratório (+categorias), radiologia (pedidos, itens, testes),
  relatórios de diagnóstico.
- **Farmácia & Estoque**: medicamentos, categorias, lotes, movimentações, compras,
  fornecedores, itens/categorias de estoque, alertas de estoque baixo.
- **Hospitalar**: leitos (+categorias, alocação, checkout), medicamentos/serviços/diagnósticos de leito.
- **Financeiro**: pagamentos, categorias, despesas, faturas, depósitos, gateway, plano de contas.
- **Seguros**: seguradoras, apólices.
- **Ambulância**: veículos, tarifas, agendamentos, pagamentos.
- **Comunicação**: SMS, e-mail, templates e shortcodes, chat, notificações.
- **Institucional/Site**: slides, galeria, FAQ, serviços, reviews, configurações do site, mapa.
- **SaaS/Plataforma**: pacotes de assinatura, módulos, logs de uso, transações, superadmin.
- **IA (fase futura)**: análise de imagem, resumo do paciente, memória de contexto.

> O schema definitivo será escrito em `supabase/migrations/` na fase de scaffold, tabela por
> tabela, com os domínios acima mapeados para o **núcleo do MVP** primeiro.

---

## 5. Módulos, pacotes e perfis

### 5.1 Catálogo de módulos (nome de referência → reaproveitados)

`accountant` · `appointment` · `lab` · `bed` · `department` · `doctor` · `donor` · `finance` ·
`pharmacy` · `laboratorist` · `medicine` · `nurse` · `patient` · `pharmacist` · `prescription` ·
`receptionist` · `report` · `notice` · `email` · `sms` · `file` · `payroll` · `attendance` ·
`leave` · `chat` · `site` · `ambulance` · `dental` · `radiology` · `insurance` · `inventory` ·
`diagnosis` · `symptom` · `treatment` · `emergency` · `meeting` · `service`

### 5.2 Pacotes sugeridos (tenant → pacote → módulos + limites)

| Pacote | Módulos | Limites |
|--------|---------|---------|
| **Básico (Clínica)** | patient, doctor, appointment, prescription, finance, report | p_limit, d_limit |
| **Clínica+ / Odonto** | Básico + dental, treatment, diagnosis, inventory (odontograma, planos) | |
| **Diagnóstico** | Básico + lab, radiology, laboratorist | |
| **Farmácia** | medicine, pharmacy, inventory, pharmacist, suppliers | |
| **Hospital Completo** | tudo: bed, emergency, ambulance, nurse, payroll, insurance, ... | |
| **Add-ons** | IA, SMS/WhatsApp, portal do paciente, site institucional | |

### 5.3 Perfis (roles)

- **MVP**: `superadmin` (SaaS), `tenant_admin`, `professional` (médico/odonto), `receptionist`, `patient` (fase 2).
- **Por módulo**: `nurse`, `pharmacist`, `laboratorist`, `accountant` entram junto com seus módulos.
- Autorização por **RBAC** + RLS por tenant.

---

## 6. Roadmap por fases

### Fase 0 — Fundação
- Repositório, lint/format (ESLint, Prettier), CI.
- Projeto Supabase (região SP), Supabase local, migrations.
- Auth (Supabase Auth) + RBAC + tenancy + **RLS base**.
- Design system (Tailwind + shadcn/ui), layout de dashboard.

### Fase 1 — MVP Núcleo
- Tenant/Hospital + pacotes + módulos + limites.
- Usuários, perfis, convites.
- Pacientes (cadastro pela recepção) + histórico.
- Profissionais + médicos.
- Agenda/consultas.
- Prontuário/atendimento + prescrição.
- Financeiro básico (pagamentos/despesas) + relatórios.
- E-mail transacional.
- **Marco**: um hospital real consegue operar o dia a dia.

### Fase 2 — Portal & Presença
- Portal do paciente (agendar, ver resultados).
- Site institucional do tenant.
- Auto-cadastro de paciente (com verificação).
- Notificações (e-mail) e base de i18n.

### Fase 3 — Módulos de Diagnóstico/Clínicos
- Laboratório, Radiologia, Farmácia/Estoque, Odontologia (odontograma e planos).
- Estoque + compras + fornecedores + alertas.

### Fase 4 — Hospitalar
- Leitos/enfermaria, emergência, ambulância, centro cirúrgico, folha de pagamento,
  seguros, presença/férias.

### Fase 5 — IA, Billing e Escala
- IA: análise de imagem, resumo do paciente.
- Billing automatizado (**Asaas**: Pix/boleto/assinatura recorrente).
- Observabilidade, backups PITR, escalabilidade.

### Fase 6 — Lançamento comercial
- Migrar para **Vercel Pro + Supabase Pro** (mesma região/região, mesmo código).
- Conformidade LGPD (DPA, política de privacidade, consentimento, logs de acesso).
- Onboarding de clientes e suporte.

---

## 7. Billing e integrações

- **Billing (SaaS)**: MVP com ativação manual + Pix; depois **Asaas** (BR-nativo). Stripe
  apenas se houver expansão internacional.
- **E-mail**: Resend ou Supabase Auth (v1).
- **SMS/WhatsApp**: fase posterior (o original usava Twilio).
- **IA**: fase 5, tratada como **módulo pago** (diferencial de receita).

---

## 8. Compliance e segurança (LGPD)

Dados de saúde são **dados sensíveis**. Desde o design:
- Isolamento por RLS + auditoria de acesso.
- Criptografia em repouso/trânsito.
- Consentimento e base legal documentados.
- Backups e PITR antes do lançamento comercial (Supabase Pro).
- Minimização de dados e controle de retenção.
- Free tiers **não** são adequados para produção de dado sensível — apenas dev/MVP.

---

## 9. Próximos passos (após aprovação deste plano)

1. Revisar/ajustar este documento.
2. Inicializar o scaffold:
   - `create-next-app` (TS, App Router, Tailwind), shadcn/ui, ESLint/Prettier.
   - Estrutura por módulos (`src/modules/<modulo>/...`).
   - Projeto Supabase (SP), `supabase/migrations/` com o schema do **Núcleo (Fase 1)**.
   - Setup de tenancy + RLS + seed de um tenant de demonstração.
3. Definir o schema da Fase 1 tabela a tabela.
4. Configurar CI/CD e ambientes (dev/prod) com região co-localizada.

---

## 10. Riscos e pontos de atenção

| Risco | Mitigação |
|-------|-----------|
| Latência por região divergente | Regra fixa: app e banco em SP |
| Waterfalls no front | Server Components + acesso direto ao banco |
| Free tier pausar/expirar | Upgrade para Pro no marco de lançamento |
| Copiar schema legado | Redesenho com FKs, tipos corretos, `tenant_id` |
| Dado sensível sem backup | PITR/backups antes de vender |
| Escopo modular crescer demais | Estritamente por fases; v1 = núcleo |
| Billing manual não escalar | Asaas na fase 5 |

---

_Fonte de inspiração (somente referência, não será reutilizada como código):
`Multi Hospital 19 April 2026` — CodeIgniter 3 (HMVC, Ion Auth, AdminLTE), banco
`gestor_hospitalar` com 153 tabelas._
