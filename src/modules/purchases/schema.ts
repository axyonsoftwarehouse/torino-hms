import { z } from "zod";

import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { optionalInt, optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const PURCHASE_STATUSES = ["draft", "ordered", "received", "canceled"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: "Rascunho",
  ordered: "Encomendada",
  received: "Recebida",
  canceled: "Cancelada",
};

export const PURCHASE_FILTERS = ["ordered", "draft", "received", "canceled", "all"] as const;
export type PurchaseFilter = (typeof PURCHASE_FILTERS)[number];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  partial: "Parcial",
  paid: "Pago",
  canceled: "Cancelado",
};

export const purchaseOrderSchema = z.object({
  supplier_id: optionalUuid,
  order_date: z.string().trim().default(""),
  expected_delivery_date: z.string().trim().default(""),
  invoice_number: z.string().trim().default(""),
  invoice_date: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const purchaseItemSchema = z.object({
  purchase_order_id: z.string().trim().min(1, "Ordem inválida"),
  medicine_id: optionalUuid,
  description: z.string().trim().min(1, "Informe a descrição"),
  quantity: optionalInt,
  unit_cost_cents: optionalMoneyCents,
  expiry_date: z.string().trim().default(""),
  batch_number: z.string().trim().default(""),
});

export const purchasePaymentSchema = z.object({
  purchase_order_id: z.string().trim().min(1, "Ordem inválida"),
  amount_cents: optionalMoneyCents,
  method: z.enum(PAYMENT_METHODS),
  paid_at: z.string().trim().default(""),
  reference: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
