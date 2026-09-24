import { z } from "zod";

import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { optionalInt, optionalMoneyCents } from "@/lib/validation";

export const BILLING_CYCLES = ["monthly", "annual"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];
export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Mensal",
  annual: "Anual",
};

export const SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "past_due",
  "suspended",
  "canceled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  active: "Ativa",
  past_due: "Em atraso",
  suspended: "Suspensa",
  canceled: "Cancelada",
};

export const SAAS_INVOICE_STATUSES = ["draft", "issued", "paid", "canceled"] as const;
export type SaasInvoiceStatus = (typeof SAAS_INVOICE_STATUSES)[number];
export const SAAS_INVOICE_STATUS_LABELS: Record<SaasInvoiceStatus, string> = {
  draft: "Rascunho",
  issued: "Em aberto",
  paid: "Paga",
  canceled: "Cancelada",
};

export const ADJUSTMENT_KINDS = ["credit", "debit", "refund"] as const;
export type AdjustmentKind = (typeof ADJUSTMENT_KINDS)[number];
export const ADJUSTMENT_KIND_LABELS: Record<AdjustmentKind, string> = {
  credit: "Crédito",
  debit: "Débito",
  refund: "Estorno",
};

export const subscriptionSchema = z.object({
  tenant_id: z.string().trim().min(1, "Selecione o tenant"),
  plan_key: z.string().trim().min(1, "Selecione o plano"),
  cycle: z.enum(BILLING_CYCLES),
  amount_cents: optionalMoneyCents,
  status: z.enum(SUBSCRIPTION_STATUSES),
  started_at: z.string().trim().default(""),
  next_due_date: z.string().trim().default(""),
  trial_ends_at: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const planPriceSchema = z.object({
  key: z.string().trim().min(1, "Plano inválido"),
  monthly_price_cents: optionalMoneyCents,
  annual_price_cents: optionalMoneyCents,
});

export const saasInvoiceSchema = z.object({
  tenant_id: z.string().trim().min(1, "Selecione o tenant"),
  due_date: z.string().trim().default(""),
  period_start: z.string().trim().default(""),
  period_end: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const saasInvoiceItemSchema = z.object({
  invoice_id: z.string().trim().min(1, "Fatura inválida"),
  description: z.string().trim().min(1, "Informe a descrição"),
  quantity: optionalInt,
  unit_price_cents: optionalMoneyCents,
});

export const saasPaymentSchema = z.object({
  invoice_id: z.string().trim().min(1, "Fatura inválida"),
  amount_cents: optionalMoneyCents,
  method: z.enum(PAYMENT_METHODS),
  paid_at: z.string().trim().default(""),
  reference: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const saasAdjustmentSchema = z.object({
  invoice_id: z.string().trim().min(1, "Fatura inválida"),
  kind: z.enum(ADJUSTMENT_KINDS),
  amount_cents: optionalMoneyCents,
  reason: z.string().trim().default(""),
});

export const COUPON_DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];
export const COUPON_DISCOUNT_TYPE_LABELS: Record<CouponDiscountType, string> = {
  percent: "Percentual (%)",
  fixed: "Valor fixo (R$)",
};

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Informe um código com ao menos 3 caracteres")
    .transform((value) => value.toUpperCase()),
  description: z.string().trim().default(""),
  discount_type: z.enum(COUPON_DISCOUNT_TYPES),
  discount_value: z.string().trim().min(1, "Informe o valor do desconto"),
  valid_until: z.string().trim().default(""),
  max_uses: optionalInt,
});

export const applyCouponSchema = z.object({
  invoice_id: z.string().trim().min(1, "Fatura inválida"),
  code: z
    .string()
    .trim()
    .min(1, "Informe o código")
    .transform((value) => value.toUpperCase()),
});
