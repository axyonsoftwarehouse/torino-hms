import { z } from "zod";

import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { optionalMoneyCents, optionalNumber, optionalUuid } from "@/lib/validation";

export const invoiceSchema = z.object({
  patient_id: z.string().trim().min(1, "Selecione o paciente"),
  encounter_id: optionalUuid,
  due_date: z.string().trim().default(""),
});

export const invoiceItemSchema = z.object({
  invoice_id: z.string().trim().min(1, "Fatura inválida"),
  service_id: optionalUuid,
  description: z.string().trim().min(1, "Informe a descrição"),
  quantity: optionalNumber,
  unit_price_cents: optionalMoneyCents,
});

export const paymentSchema = z.object({
  invoice_id: z.string().trim().min(1, "Fatura inválida"),
  amount_cents: optionalMoneyCents,
  method: z.enum(PAYMENT_METHODS),
  paid_at: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

export const INVOICE_FILTERS = ["draft", "issued", "paid", "canceled", "all"] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  issued: "Emitida",
  paid: "Paga",
  canceled: "Cancelada",
};

export const INVOICE_FILTER_LABELS: Record<InvoiceFilter, string> = {
  draft: "Rascunhos",
  issued: "Em aberto",
  paid: "Pagas",
  canceled: "Canceladas",
  all: "Todas",
};
