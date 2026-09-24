import { z } from "zod";

import { optionalInt, optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const EXAM_KINDS = ["lab", "imaging"] as const;
export type ExamKind = (typeof EXAM_KINDS)[number];
export const EXAM_KIND_LABELS: Record<ExamKind, string> = {
  lab: "Laboratório",
  imaging: "Imagem",
};

export const EXAM_URGENCIES = ["routine", "urgent", "stat"] as const;
export type ExamUrgency = (typeof EXAM_URGENCIES)[number];
export const EXAM_URGENCY_LABELS: Record<ExamUrgency, string> = {
  routine: "Rotina",
  urgent: "Urgente",
  stat: "Emergência",
};

export const EXAM_STATUSES = [
  "pending",
  "collected",
  "in_progress",
  "completed",
  "delivered",
  "canceled",
] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];
export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  pending: "Pendente",
  collected: "Coletado",
  in_progress: "Em análise",
  completed: "Concluído",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export const EXAM_FILTERS = [
  "pending",
  "collected",
  "in_progress",
  "completed",
  "delivered",
  "canceled",
  "all",
] as const;
export type ExamFilter = (typeof EXAM_FILTERS)[number];

export const examCategorySchema = z.object({
  kind: z.enum(EXAM_KINDS),
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
});

export const examTestSchema = z.object({
  category_id: optionalUuid,
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
  price_cents: optionalMoneyCents,
  duration_minutes: optionalInt,
  preparation_instructions: z.string().trim().default(""),
  reference_value: z.string().trim().default(""),
});

export const examOrderSchema = z.object({
  patient_id: z.string().trim().min(1, "Selecione o paciente"),
  professional_id: optionalUuid,
  kind: z.enum(EXAM_KINDS),
  urgency: z.enum(EXAM_URGENCIES),
  clinical_notes: z.string().trim().default(""),
});

export const examOrderItemSchema = z.object({
  order_id: z.string().trim().min(1, "Pedido inválido"),
  test_id: z.string().trim().min(1, "Selecione o exame"),
  quantity: optionalInt,
});

export const examResultSchema = z.object({
  item_id: z.string().trim().min(1),
  order_id: z.string().trim().min(1),
  result: z.string().trim().default(""),
});
