import { z } from "zod";

import { optionalInt, optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const EQUIPMENT_CRITICALITIES = ["low", "medium", "high"] as const;
export type EquipmentCriticality = (typeof EQUIPMENT_CRITICALITIES)[number];
export const EQUIPMENT_CRITICALITY_LABELS: Record<EquipmentCriticality, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const EQUIPMENT_STATUSES = ["active", "maintenance", "inactive", "decommissioned"] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];
export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  active: "Ativo",
  maintenance: "Em manutenção",
  inactive: "Inativo",
  decommissioned: "Baixado",
};

export const SERVICE_ORDER_TYPES = ["preventive", "corrective", "calibration", "inspection"] as const;
export type ServiceOrderType = (typeof SERVICE_ORDER_TYPES)[number];
export const SERVICE_ORDER_TYPE_LABELS: Record<ServiceOrderType, string> = {
  preventive: "Preventiva",
  corrective: "Corretiva",
  calibration: "Calibração",
  inspection: "Inspeção",
};

export const SERVICE_ORDER_STATUSES = ["open", "in_progress", "done", "canceled"] as const;
export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];
export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  done: "Concluída",
  canceled: "Cancelada",
};

export const equipmentCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
});

export const equipmentSchema = z.object({
  category_id: optionalUuid,
  name: z.string().trim().min(2, "Informe o nome"),
  asset_tag: z.string().trim().default(""),
  serial_number: z.string().trim().default(""),
  manufacturer: z.string().trim().default(""),
  model: z.string().trim().default(""),
  anvisa_registration: z.string().trim().default(""),
  location: z.string().trim().default(""),
  responsible: z.string().trim().default(""),
  acquisition_date: z.string().trim().default(""),
  acquisition_value_cents: optionalMoneyCents,
  warranty_until: z.string().trim().default(""),
  criticality: z.enum(EQUIPMENT_CRITICALITIES),
  status: z.enum(EQUIPMENT_STATUSES),
  notes: z.string().trim().default(""),
});

export const maintenancePlanSchema = z.object({
  equipment_id: z.string().trim().min(1, "Equipamento inválido"),
  description: z.string().trim().min(2, "Informe a descrição"),
  periodicity_days: optionalInt,
  last_done_at: z.string().trim().default(""),
  next_due_date: z.string().trim().default(""),
});

export const serviceOrderSchema = z.object({
  equipment_id: z.string().trim().min(1, "Equipamento inválido"),
  type: z.enum(SERVICE_ORDER_TYPES),
  scheduled_at: z.string().trim().default(""),
  technician: z.string().trim().default(""),
  description: z.string().trim().default(""),
  cost_cents: optionalMoneyCents,
});

export const serviceOrderCloseSchema = z.object({
  id: z.string().trim().min(1, "OS inválida"),
  status: z.enum(SERVICE_ORDER_STATUSES),
  technician: z.string().trim().default(""),
  findings: z.string().trim().default(""),
  cost_cents: optionalMoneyCents,
  certificate_number: z.string().trim().default(""),
  certificate_expires_at: z.string().trim().default(""),
});

export const EQUIPMENT_LOAN_STATUSES = ["loaned", "returned"] as const;
export type EquipmentLoanStatus = (typeof EQUIPMENT_LOAN_STATUSES)[number];
export const EQUIPMENT_LOAN_STATUS_LABELS: Record<EquipmentLoanStatus, string> = {
  loaned: "Em posse do setor",
  returned: "Recolhido",
};

export const EQUIPMENT_CONTRACT_TYPES = ["warranty", "maintenance", "rental", "other"] as const;
export type EquipmentContractType = (typeof EQUIPMENT_CONTRACT_TYPES)[number];
export const EQUIPMENT_CONTRACT_TYPE_LABELS: Record<EquipmentContractType, string> = {
  warranty: "Garantia",
  maintenance: "Manutenção",
  rental: "Locação",
  other: "Outro",
};

export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export const loanSchema = z.object({
  equipment_id: z.string().trim().min(1, "Selecione o equipamento"),
  sector: z.string().trim().min(2, "Informe o setor"),
  patient_reference: z.string().trim().default(""),
  received_by: z.string().trim().default(""),
  condition_out: z.string().trim().default(""),
  isolation: z.string().default(""),
  infection_notes: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const returnLoanSchema = z.object({
  id: z.string().trim().min(1, "Empréstimo inválido"),
  returned_to: z.string().trim().default(""),
  condition_in: z.string().trim().default(""),
  disinfection_done: z.string().default(""),
  notes: z.string().trim().default(""),
});

export const equipmentContractSchema = z.object({
  equipment_id: z.string().trim().min(1, "Selecione o equipamento"),
  type: z.enum(EQUIPMENT_CONTRACT_TYPES),
  provider: z.string().trim().default(""),
  start_date: z.string().trim().default(""),
  end_date: z.string().trim().default(""),
  value_cents: optionalMoneyCents,
  notes: z.string().trim().default(""),
});

export const equipmentIncidentSchema = z.object({
  equipment_id: z.string().trim().min(1, "Selecione o equipamento"),
  occurred_at: z.string().trim().default(""),
  description: z.string().trim().min(2, "Descreva o evento"),
  severity: z.enum(INCIDENT_SEVERITIES),
  anvisa_notified: z.string().default(""),
  notification_number: z.string().trim().default(""),
});

export const LOAN_FILTERS = ["active", "returned", "all"] as const;
export type LoanFilter = (typeof LOAN_FILTERS)[number];
