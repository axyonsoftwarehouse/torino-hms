-- =============================================================================
-- Torino HMS — Prontuário/Atendimento: sinais vitais e CID
-- Inspirado nas tabelas vital_signs / daily_progress / medical_history do
-- sistema de referência.
-- =============================================================================

alter table public.encounters
  add column if not exists weight_kg      numeric,
  add column if not exists height_cm      numeric,
  add column if not exists blood_pressure text,
  add column if not exists temperature_c  numeric,
  add column if not exists heart_rate     integer,
  add column if not exists diagnosis_code text;

create index if not exists encounters_tenant_started_idx
  on public.encounters (tenant_id, started_at desc);
