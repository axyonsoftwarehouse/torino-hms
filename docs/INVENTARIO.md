# Torino HMS — Inventário de Funcionalidades

> Levantamento comparativo: **o que já temos** × **varredura completa do projeto de
> referência** (`Multi Hospital 19 April 2026` — CodeIgniter 3 / HMVC, 153 tabelas, 68 módulos).
> Objetivo: garantir que nenhuma funcionalidade fique perdida.

**Legenda de status**
- ✅ **Feito** — temos equivalente funcional.
- 🟡 **Parcial** — temos parte; falta refinamento.
- ⛔ **Falta** — ainda não temos.
- ⚪ **Dispensável/Legado** — infra ou campo do legado sem valor de produto (fica de fora por decisão de design).

---

## Parte A — O que já temos (Torino HMS)

Estrutura: `src/modules/*` (domínio) + `src/app/app/*` (rotas) + `supabase/migrations/*`.

| Domínio | Módulo (código) | Rota(s) | Situação |
|---|---|---|---|
| Tenancy/SaaS | `tenants`, `core` | `/app/tenants`, `/app/tenants/[id]` | ✅ pacotes, módulos, limites, gating de menu |
| Acesso/Auth | `core` | `/login` | ✅ Supabase Auth, perfis, superadmin, tenant switcher; 🟡 RBAC fino/convites |
| Painel | — | `/app` | ✅ KPIs reais |
| Pacientes | `patients` | `/app/patients` | ✅ CRUD + soft delete |
| Profissionais | `professionals` | `/app/doctors`, `/app/doctors/[id]` | ✅ + disponibilidade semanal/slots |
| Departamentos | `departments` | `/app/departments` | ✅ |
| Agenda | `appointments`, `schedules` | `/app/appointments` | ✅ status + **detecção de conflito** |
| Atendimentos/Prontuário | `encounters`, `prescriptions` | `/app/encounters`, `/app/encounters/[id]` | ✅ vitais, CID, evolução, prescrição, histórico |
| Leitos/Internação | `beds` | `/app/beds`, `/app/beds/assignments/[id]` | ✅ categorias, leitos, internação, alta |
| Exames (Lab+Imagem) | `diagnostics` | `/app/diagnostics`, `/app/diagnostics/catalog`, `/app/diagnostics/[id]` | ✅ catálogo, pedidos, laudo por item, status |
| Laudos clínicos | `medical-reports` | `/app/medical-reports`, `/app/medical-reports/[id]` | ✅ nascimento/cirurgia/óbito/geral |
| Farmácia/Estoque | `pharmacy` | `/app/pharmacy`, `/app/pharmacy/[id]`, `/app/pharmacy/suppliers`, `/app/pharmacy/reports` | ✅ medicamentos, lotes, movimentos (FEFO), alertas, valoração/consumo/ABC |
| Compras | `purchases` | `/app/purchases`, `/app/purchases/[id]` | ✅ OC, recebimento (entrada em estoque), contas a pagar |
| Financeiro | `invoices`, `expenses`, `services` | `/app/finance`, `/app/finance/[id]`, `/app/expenses`, `/app/services` | ✅ faturas, itens, pagamentos, despesas, catálogo de serviços |
| Relatórios | `reports` | `/app/reports` | ✅ faturamento, recebimentos, repasses, despesas |
| UI/UX (Fase A) | — | global | ✅ tema mint/teal/navy, sidebar pill, header (busca/sino/tema/avatar), chips de status |

Infra: Next.js 16 (App Router) + Supabase (Postgres/RLS/Auth) + Tailwind v4 + shadcn/ui (Base UI);
10 migrations; RLS multi-tenant em todas as tabelas; região SP; `TZ=America/Sao_Paulo`.

---

## Parte B — Varredura completa do projeto de referência (153 tabelas)

### B1. Tenancy, acesso, SaaS e plataforma
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `users`, `users_groups`, `groups` | ✅ | Módulo **Equipe** (`/app/team`): papéis, ativar/desativar e **convites por link** (`/invite/[token]`) |
| `hospital`, `package`, `module` | ✅ | `tenants`, pacotes e `tenant_modules` |
| `superadmin` | ✅ | role `superadmin` |
| `settings`, `website_settings`, `site_settings` | 🟡 | Tela `/app/settings` ainda placeholder |
| `login_attempts` | ⛔ | Segurança de login (rate limit/bloqueio) |
| `logs`, `transaction_logs`, `usage_logs`, `monthly_usage_summary` | 🟡/⛔ | `audit_logs` existe sem UI; faltam logs de uso/analytics SaaS |
| `hospital_deposit`, `hospital_payment` | ✅ | **Billing do SaaS** (`/app/billing`): assinaturas, faturas do SaaS, pagamentos, créditos/débitos/estorno |
| `request` | ⛔ | Solicitações de cadastro de novos clientes (SaaS) |
| `language` | ⛔ | i18n (multi-idioma) |
| `google_captcha`, `bankb`, `testpkz`, `category`, `pservice`, `template`, `grid` | ⚪ | Legado/infra sem valor de produto |

### B2. Pacientes e histórico clínico
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `patient` | ✅ | `patients` |
| `medical_history` | 🟡 | Usamos `encounters` como histórico; falta ficha de antecedentes dedicada |
| `vital_signs` | ✅ | Sinais vitais no `encounters` |
| `daily_progress` | ⛔ | Evolução diária (internação/enfermaria) |
| `diagnosis`, `symptom` | 🟡/⛔ | Temos `diagnosis_code` (texto); falta **catálogo CID/sintomas** |
| `treatment`, `treatment_plans` | ⛔ | Catálogo de tratamentos e **planos terapêuticos** |
| `patient_deposit`, `patient_material` | ⛔ | Depósitos do paciente e materiais |
| `blood_group`, `donor` | ⛔ | **Banco de sangue** (doadores, grupos) |

### B3. Equipe e RH
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `doctor` | ✅ | `professionals` |
| `nurse`, `laboratorist`, `pharmacist`, `receptionist`, `accountant` | ⚪/🟡 | Representados por `profiles.role`; telas dedicadas de equipe faltam |
| `attendance` | ⛔ | Ponto/assiduidade |
| `leaves`, `leave_type`, `holidays` | ⛔ | Férias, licenças e feriados |
| `payroll`, `salary` | ⛔ | **Folha de pagamento** |
| `doctor_visit` | ⛔ | Tipos de visita e valores (1ª consulta/retorno) |

### B4. Agenda, atendimento e hospitalar
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `appointment` | ✅ | `appointments` (+ conflito) |
| `time_schedule`, `time_slot` | ✅ | `professional_schedules` + slots gerados |
| `emergency` | ⛔ | Pronto atendimento/emergência |
| `meeting`, `meeting_settings` | ⛔ | Reuniões/teleconsulta |
| `bed`, `bed_category`, `alloted_bed`, `bed_checkout` | ✅ | `beds`/`bed_assignments`/`bed_discharges` |
| `bed_medicine`, `bed_service`, `bed_diagnostic` | ⛔ | Consumos/charges vinculados ao leito |
| `ot_payment` (centro cirúrgico) | ⛔ | Centro cirúrgico/OT |

### B5. Clínico/Prontuário
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `prescription` | ✅ | `prescriptions` + itens |
| `dental_*`, `odontogram` (7 tabelas) | ⛔ | **Odontologia** completa (odontograma, planos, exames, imagens) |
| `macro` | ⛔ | Atalhos de texto/histórico |
| `advice` | ⛔ | Orientações/avisos clínicos |

### B6. Diagnóstico
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `lab`, `lab_category` | ✅ | `exam_categories`/`exam_tests`/`exam_orders` (tipo lab) |
| `radiology_categories`, `radiology_tests`, `radiology_orders`, `radiology_order_items` | ✅ | Modelo unificado de Exames (tipo imagem) |
| `diagnostic_report` | 🟡 | Laudo por item existe; falta template/PDF/impressão e **etiquetas/código de barras** de amostra |

### B7. Farmácia, estoque e compras
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `medicine`, `medicine_category`, `medicine_batches`, `medicine_stock_movements`, `medicine_stock_with_batches` | ✅ | Módulo Farmácia |
| `medicine_low_stock`, `low_stock_items` | ✅/🟡 | Alerta de baixo estoque (derivado) |
| `medicine_suppliers`, `suppliers` | ✅ | `suppliers` |
| `medicine_purchases`, `medicine_purchase_items`, `medicine_purchase_payments` | ✅ | Módulo Compras + contas a pagar |
| `inventory_categories`, `inventory_items`, `stock_transactions` | 🟡 | Só estoque de medicamentos; falta **estoque genérico de suprimentos** |
| `usage_logs`, `monthly_usage_summary` | ⛔ | Consumo por setor/relatórios de uso |
| `vendor_quotations`, `vendor_quotation_items` | ⛔ | **Cotações de fornecedores** (comparativo de preços) |
| `purchase_order_summary` | 🟡 | Resumos de OC |

### B8. Financeiro
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `payment`, `payment_category` | ✅/🟡 | `payments` (categorias de pagamento faltam) |
| `expense`, `expense_category` | ✅ | Módulo Despesas |
| `service` | ✅ | `services` |
| `paymentGateway` (+ módulos paypal/paystack/payu/pgateway) | ⛔ | **Gateways de pagamento** (o original tem 4) |
| `draft_payment`, `pharmacy_payment`, `pharmacy_expense`, `pharmacy_*_category` | 🟡 | Coberto por `payments`/`expenses` (sem categorização fiscal) |
| `insurance_company` | ✅ | Módulo **Convênios** (`/app/insurance`) + vínculo no paciente (convênio/carteirinha) |
| `payroll`, `salary` | ⛔ | Folha de pagamento |

### B9. Ambulância
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `ambulance`, `ambulance_rates`, `ambulance_bookings`, `ambulance_payments` | ✅ | **Frota/Ambulância** (`/app/fleet`): veículos, motoristas, viagens, manutenção, combustível e documentos (inspirado no Fleet Management) |

### B10. Comunicação
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `sms`, `sms_settings`, `autosmstemplate`, `autosmsshortcode`, `manualsmsshortcode`, `manual_sms_template` | ⛔ | **SMS** (templates, shortcodes) |
| `email`, `email_settings`, `autoemailtemplate`, `autoemailshortcode`, `manualemailshortcode`, `manual_email_template` | 🟡/⛔ | E-mail transacional via Supabase; faltam templates/regras |
| `chat` | ⛔ | Chat interno |
| `notice` | ⛔ | Mural de avisos |

### B11. Conteúdo / Site institucional
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `site_settings`, `site_slide`, `slide`, `site_gallery`, `gallery`, `site_grid`, `site_map`, `site_review`, `review`, `site_service`, `site_featured`, `featured`, `faq`, `facilitie` | ⛔ | **Site institucional** do tenant (fase 2) |

### B12. Arquivos e IA
| Tabela(s) referência | Status | Observação |
|---|---|---|
| `file`, `folder` | ⛔ | Gestão de arquivos/documentos |
| `ai_image_analyses`, `ai_patient_overviews`, `gpt_memory` | ⛔ | **IA** (análise de imagem, resumo do paciente) — módulo pago |

---

## Parte C — Lacunas priorizadas (o que falta)

**Alta prioridade (núcleo/SaaS)**
1. **Usuários/Equipe + RBAC** (convites, múltiplos papéis, ativar/desativar) — ✅ **feito** (Equipe + papéis + convites por link).
2. **Billing do SaaS** (assinatura dos tenants) — ✅ **feito** (inspirado no módulo de compras do Perfex CRM).
3. **Gateways de pagamento** (Pix/cartão) para faturas dos pacientes.
4. **Convênios/seguros** (`insurance_company`) — ✅ **feito** (módulo Convênios).
5. **Catálogo de diagnósticos (CID) e de tratamentos/planos**.
6. **Tela de Configurações** do tenant (dados, pacote, preferências).

**Média prioridade (clínico/hospitalar)**
7. **Odontologia** (odontograma, planos, imagens) — pacote Odonto.
8. **Emergência** e **Centro cirúrgico**.
9. **Folha de pagamento + ponto + férias/feriados** (RH).
10. **Estoque genérico de suprimentos** + consumo por setor.
11. **Banco de sangue/doadores**.
12. **Ambulância**.
13. **Consumos vinculados ao leito** (`bed_medicine/service/diagnostic`).

**Média/baixa (comunicação e conteúdo)**
14. **SMS/WhatsApp + templates de e-mail**.
15. **Chat interno** e **mural de avisos**.
16. **Site institucional** do tenant (fase 2).
17. **Portal do paciente** (fase 2).

**Baixa / diferenciais**
18. **Engenharia Clínica** (§11.1 do PLANO) — **inexistente no original**; diferencial Brasil.
19. **IA** (imagem/resumo) — módulo pago.
20. **i18n**, **auditoria/logs com UI**, **cotação de fornecedores**.

---

## Parte D — Notas

- **Fontes**: o projeto de referência (AdminLTE) usa **Source Sans Pro**. O template das imagens
  (**WellNest / Peterdraw**) **não está no projeto**; o nome da fonte **não é extraível das imagens**
  (AVIF sem metadado de fonte). Candidatos visuais: **Plus Jakarta Sans / Poppins / Manrope**.
  **Aplicado no Torino: Plus Jakarta Sans** (`next/font/google`).
- **UI (WellNest)**: **Fase A** (tema mint/teal/navy, sidebar pill, header, KPIs, chips),
  **Fase B** (gráficos barras/linha/donut + alertas) e **Fase C** (PageHeader padronizado,
  busca + paginação em Pacientes, página de detalhe do paciente com tiles). Demais listas
  podem adotar o mesmo padrão.
- **Engenharia Clínica**: confirmada **ausente** no original (o `inventory` é suprimentos genéricos).
  **Implementado** (`/app/equipment`, Fases 1 e 2): equipamentos (ANVISA/criticidade), planos de
  manutenção, ordens de serviço (preventiva/corretiva/calibração/inspeção), **rastreabilidade de
  entrega/recolhimento por setor** (isolamento/desinfecção), contratos, certificados de calibração,
  tecnovigilância e indicadores (disponibilidade/MTTR) + alerta no painel.
- **Help Desk + Base de Conhecimento**: **não existem** no projeto de referência. Foram adicionados
  como **diferencial**, inspirados em dois módulos externos: **HelpDesk Pro** (tickets,
  departamentos, SLA, e-mail→ticket) e **PerfexWiki** (livros→artigos com slug, visualizações,
  publicação). MVP entregue: chamados internos/de suporte SaaS + base de conhecimento.
- Muitas tabelas do legado são **desnormalizadas/sem FK**; nosso schema foi **redesenhado**
  (uuid, FKs, `timestamptz`, `tenant_id`, RLS) — por isso alguns itens viram "Parcial/Feito" em vez de cópia.
