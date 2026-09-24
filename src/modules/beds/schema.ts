import { z } from "zod";

import { optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const BED_STATUSES = ["available", "occupied", "maintenance"] as const;
export type BedStatus = (typeof BED_STATUSES)[number];

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  available: "Disponível",
  occupied: "Ocupado",
  maintenance: "Manutenção",
};

export const bedCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
});

export const bedSchema = z.object({
  category_id: z.string().trim().min(1, "Selecione a categoria"),
  number: z.string().trim().min(1, "Informe o número"),
  description: z.string().trim().default(""),
  daily_rate_cents: optionalMoneyCents,
});

export const admissionSchema = z.object({
  bed_id: z.string().trim().min(1, "Selecione o leito"),
  patient_id: z.string().trim().min(1, "Selecione o paciente"),
  professional_id: optionalUuid,
  diagnosis: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const dischargeSchema = z.object({
  assignment_id: z.string().trim().min(1),
  discharged_at: z.string().trim().default(""),
  final_diagnosis: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  instructions: z.string().trim().default(""),
});

export const ASSIGNMENT_FILTERS = ["active", "discharged", "all"] as const;
export type AssignmentFilter = (typeof ASSIGNMENT_FILTERS)[number];
