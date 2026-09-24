import { z } from "zod";

import { optionalInt, optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const medicineCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  company_name: z.string().trim().default(""),
  contact_person: z.string().trim().default(""),
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  address: z.string().trim().default(""),
  tax_number: z.string().trim().default(""),
});

export const medicineSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  generic_name: z.string().trim().default(""),
  category_id: optionalUuid,
  manufacturer: z.string().trim().default(""),
  unit: z.string().trim().default(""),
  purchase_price_cents: optionalMoneyCents,
  sale_price_cents: optionalMoneyCents,
  reorder_level: optionalInt,
  notes: z.string().trim().default(""),
});

export const stockInSchema = z.object({
  medicine_id: z.string().trim().min(1, "Medicamento inválido"),
  supplier_id: optionalUuid,
  batch_number: z.string().trim().min(1, "Informe o lote"),
  expiry_date: z.string().trim().default(""),
  quantity: optionalInt,
  unit_cost_cents: optionalMoneyCents,
  notes: z.string().trim().default(""),
});

export const MOVEMENT_TYPES = ["out", "expired", "damaged", "return", "adjustment"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const stockOutSchema = z.object({
  medicine_id: z.string().trim().min(1, "Medicamento inválido"),
  movement_type: z.enum(MOVEMENT_TYPES),
  quantity: optionalInt,
  notes: z.string().trim().default(""),
});

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Saída",
  adjustment: "Ajuste",
  expired: "Vencido",
  damaged: "Avariado",
  return: "Devolução",
};
