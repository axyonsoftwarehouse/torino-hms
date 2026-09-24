"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  applyCouponSchema,
  BILLING_CYCLE_LABELS,
  couponSchema,
  planPriceSchema,
  saasAdjustmentSchema,
  saasInvoiceItemSchema,
  saasInvoiceSchema,
  saasPaymentSchema,
  subscriptionSchema,
  type BillingCycle,
} from "./schema";

export type BillingActionState = { ok: boolean; error?: string; message?: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function requirePlatform(): Promise<boolean> {
  const session = await requireSession();
  return session.isSuperadmin;
}

async function refreshInvoice(supabase: Supabase, invoiceId: string) {
  const [{ data: items }, { data: payments }, { data: adjustments }] = await Promise.all([
    supabase.from("saas_invoice_items").select("total_cents").eq("invoice_id", invoiceId),
    supabase.from("saas_payments").select("amount_cents").eq("invoice_id", invoiceId),
    supabase.from("saas_adjustments").select("kind, amount_cents").eq("invoice_id", invoiceId),
  ]);

  const sumBy = (kind: string) =>
    (adjustments ?? [])
      .filter((a) => a.kind === kind)
      .reduce((total, a) => total + (a.amount_cents ?? 0), 0);

  const subtotal = (items ?? []).reduce((total, i) => total + (i.total_cents ?? 0), 0);
  const total = subtotal + sumBy("debit") - sumBy("credit");
  const paid =
    (payments ?? []).reduce((acc, p) => acc + (p.amount_cents ?? 0), 0) - sumBy("refund");

  const { data: invoice } = await supabase
    .from("saas_invoices")
    .select("status, discount_cents")
    .eq("id", invoiceId)
    .maybeSingle();

  const current = invoice?.status ?? "draft";
  const discount = invoice?.discount_cents ?? 0;
  const totalWithDiscount = total - discount;
  let status = current;
  if (current !== "canceled") {
    if (totalWithDiscount > 0 && paid >= totalWithDiscount) status = "paid";
    else if (paid > 0) status = "issued";
    else if (current === "paid") status = "issued";
  }

  await supabase
    .from("saas_invoices")
    .update({ total_cents: totalWithDiscount, status })
    .eq("id", invoiceId);
}

/* ------------------------------ Assinaturas ------------------------------ */

export async function saveSubscription(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  if (!(await requirePlatform())) return { ok: false, error: "Apenas superadmin." };

  const parsed = subscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").upsert(
    {
      tenant_id: v.tenant_id,
      plan_key: v.plan_key,
      cycle: v.cycle,
      amount_cents: v.amount_cents ?? 0,
      status: v.status,
      started_at: v.started_at || new Date().toISOString().slice(0, 10),
      next_due_date: v.next_due_date || null,
      trial_ends_at: v.trial_ends_at || null,
      notes: v.notes || null,
    },
    { onConflict: "tenant_id" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/billing/subscriptions");
  revalidatePath("/app/billing");
  return { ok: true, message: "Assinatura salva." };
}

export async function updatePlanPrice(formData: FormData): Promise<void> {
  if (!(await requirePlatform())) return;

  const parsed = planPriceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("saas_plans")
    .update({
      monthly_price_cents: parsed.data.monthly_price_cents ?? 0,
      annual_price_cents: parsed.data.annual_price_cents ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("key", parsed.data.key);

  revalidatePath("/app/billing/subscriptions");
}

/* -------------------------------- Faturas -------------------------------- */

export async function createSaasInvoice(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  if (!(await requirePlatform())) return { ok: false, error: "Apenas superadmin." };

  const parsed = saasInvoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { count } = await supabase
    .from("saas_invoices")
    .select("*", { count: "exact", head: true });
  const number = `SAAS-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: invoice, error } = await supabase
    .from("saas_invoices")
    .insert({
      tenant_id: v.tenant_id,
      number,
      status: "draft",
      total_cents: 0,
      due_date: v.due_date || null,
      period_start: v.period_start || null,
      period_end: v.period_end || null,
      notes: v.notes || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Lança automaticamente o valor do plano da assinatura do tenant
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_key, cycle, amount_cents, plan:saas_plans(name)")
    .eq("tenant_id", v.tenant_id)
    .maybeSingle();

  if (subscription) {
    const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
    const cycle = BILLING_CYCLE_LABELS[subscription.cycle as BillingCycle] ?? subscription.cycle;
    await supabase.from("saas_invoice_items").insert({
      invoice_id: invoice!.id,
      description: `Plano ${plan?.name ?? subscription.plan_key} (${cycle})`,
      quantity: 1,
      unit_price_cents: subscription.amount_cents ?? 0,
      total_cents: subscription.amount_cents ?? 0,
    });
    await refreshInvoice(supabase, invoice!.id);
  }

  revalidatePath("/app/billing/invoices");
  redirect(`/app/billing/invoices/${invoice!.id}`);
}

export async function addSaasInvoiceItem(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  if (!(await requirePlatform())) return { ok: false, error: "Apenas superadmin." };

  const parsed = saasInvoiceItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const quantity = v.quantity ?? 1;
  const unit = v.unit_price_cents ?? 0;

  const supabase = await createClient();
  const { error } = await supabase.from("saas_invoice_items").insert({
    invoice_id: v.invoice_id,
    description: v.description,
    quantity,
    unit_price_cents: unit,
    total_cents: quantity * unit,
  });
  if (error) return { ok: false, error: error.message };

  await refreshInvoice(supabase, v.invoice_id);
  revalidatePath(`/app/billing/invoices/${v.invoice_id}`);
  return { ok: true, message: "Item adicionado." };
}

export async function deleteSaasInvoiceItem(formData: FormData): Promise<void> {
  if (!(await requirePlatform())) return;
  const id = formData.get("id");
  const invoiceId = formData.get("invoice_id");
  if (typeof id !== "string" || !id || typeof invoiceId !== "string") return;

  const supabase = await createClient();
  await supabase.from("saas_invoice_items").delete().eq("id", id);
  await refreshInvoice(supabase, invoiceId);
  revalidatePath(`/app/billing/invoices/${invoiceId}`);
}

export async function issueSaasInvoice(formData: FormData): Promise<void> {
  if (!(await requirePlatform())) return;
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase
    .from("saas_invoices")
    .update({ status: "issued", issued_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/app/billing/invoices/${id}`);
  revalidatePath("/app/billing/invoices");
}

export async function cancelSaasInvoice(formData: FormData): Promise<void> {
  if (!(await requirePlatform())) return;
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("saas_invoices").update({ status: "canceled" }).eq("id", id);
  revalidatePath(`/app/billing/invoices/${id}`);
  revalidatePath("/app/billing/invoices");
}

export async function addSaasPayment(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  if (!(await requirePlatform())) return { ok: false, error: "Apenas superadmin." };

  const parsed = saasPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const amount = v.amount_cents ?? 0;
  if (amount <= 0) return { ok: false, error: "Informe um valor válido." };

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("saas_invoices")
    .select("tenant_id")
    .eq("id", v.invoice_id)
    .maybeSingle();
  if (!invoice) return { ok: false, error: "Fatura não encontrada." };

  const { error } = await supabase.from("saas_payments").insert({
    invoice_id: v.invoice_id,
    tenant_id: invoice.tenant_id,
    amount_cents: amount,
    method: v.method,
    paid_at: v.paid_at || new Date().toISOString().slice(0, 10),
    reference: v.reference || null,
    notes: v.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  await refreshInvoice(supabase, v.invoice_id);
  revalidatePath(`/app/billing/invoices/${v.invoice_id}`);
  revalidatePath("/app/billing/invoices");
  return { ok: true, message: "Pagamento registrado." };
}

export async function addSaasAdjustment(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  if (!(await requirePlatform())) return { ok: false, error: "Apenas superadmin." };

  const parsed = saasAdjustmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const amount = v.amount_cents ?? 0;
  if (amount <= 0) return { ok: false, error: "Informe um valor válido." };

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("saas_invoices")
    .select("tenant_id")
    .eq("id", v.invoice_id)
    .maybeSingle();
  if (!invoice) return { ok: false, error: "Fatura não encontrada." };

  const { error } = await supabase.from("saas_adjustments").insert({
    invoice_id: v.invoice_id,
    tenant_id: invoice.tenant_id,
    kind: v.kind,
    amount_cents: amount,
    reason: v.reason || null,
  });
  if (error) return { ok: false, error: error.message };

  await refreshInvoice(supabase, v.invoice_id);
  revalidatePath(`/app/billing/invoices/${v.invoice_id}`);
  return { ok: true, message: "Ajuste registrado." };
}

/* --------------------------------- Cupons --------------------------------- */

export async function createCoupon(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  if (!(await requirePlatform())) return { ok: false, error: "Apenas superadmin." };

  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const raw = v.discount_value;
  let value: number;

  if (v.discount_type === "percent") {
    const percent = Number(raw.replace(",", "."));
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return { ok: false, error: "Percentual deve ser entre 1 e 100." };
    }
    value = Math.round(percent);
  } else {
    const normalized = raw.includes(",")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw;
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Valor inválido." };
    }
    value = Math.round(amount * 100);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    code: v.code,
    description: v.description || null,
    discount_type: v.discount_type,
    discount_value: value,
    valid_until: v.valid_until || null,
    max_uses: v.max_uses,
  });

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Já existe um cupom com esse código." : error.message,
    };
  }

  revalidatePath("/app/billing/coupons");
  return { ok: true, message: "Cupom criado." };
}

export async function deleteCoupon(formData: FormData): Promise<void> {
  if (!(await requirePlatform())) return;
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("coupons").delete().eq("id", id);
  revalidatePath("/app/billing/coupons");
}

export async function applyCouponToInvoice(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  if (!(await requirePlatform())) return { ok: false, error: "Apenas superadmin." };

  const parsed = applyCouponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("saas_invoices")
    .select("id, status")
    .eq("id", v.invoice_id)
    .maybeSingle();
  if (!invoice) return { ok: false, error: "Fatura não encontrada." };
  if (invoice.status === "canceled") {
    return { ok: false, error: "Fatura cancelada." };
  }

  const { data: coupon } = await supabase
    .from("coupons")
    .select("id, code, discount_type, discount_value, valid_until, max_uses, used_count, active")
    .eq("code", v.code)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);
  const valid =
    coupon &&
    coupon.active &&
    (!coupon.valid_until || coupon.valid_until >= today) &&
    (coupon.max_uses === null || coupon.used_count < coupon.max_uses);

  if (!coupon || !valid) {
    return { ok: false, error: "Cupom inválido, expirado ou esgotado." };
  }

  const { data: items } = await supabase
    .from("saas_invoice_items")
    .select("total_cents")
    .eq("invoice_id", v.invoice_id);
  const subtotal = (items ?? []).reduce((total, i) => total + (i.total_cents ?? 0), 0);

  const discount =
    coupon.discount_type === "percent"
      ? Math.round((subtotal * coupon.discount_value) / 100)
      : Math.min(coupon.discount_value, subtotal);

  await supabase
    .from("saas_invoices")
    .update({ coupon_code: coupon.code, discount_cents: discount })
    .eq("id", v.invoice_id);

  await supabase
    .from("coupons")
    .update({ used_count: (coupon.used_count ?? 0) + 1 })
    .eq("id", coupon.id);

  await refreshInvoice(supabase, v.invoice_id);
  revalidatePath(`/app/billing/invoices/${v.invoice_id}`);
  return { ok: true, message: "Cupom aplicado." };
}

export async function removeCouponFromInvoice(formData: FormData): Promise<void> {
  if (!(await requirePlatform())) return;
  const invoiceId = formData.get("invoice_id");
  if (typeof invoiceId !== "string" || !invoiceId) return;

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("saas_invoices")
    .select("coupon_code")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoice?.coupon_code) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, used_count")
      .eq("code", invoice.coupon_code)
      .maybeSingle();
    if (coupon) {
      await supabase
        .from("coupons")
        .update({ used_count: Math.max(0, (coupon.used_count ?? 1) - 1) })
        .eq("id", coupon.id);
    }
  }

  await supabase
    .from("saas_invoices")
    .update({ coupon_code: null, discount_cents: 0 })
    .eq("id", invoiceId);

  await refreshInvoice(supabase, invoiceId);
  revalidatePath(`/app/billing/invoices/${invoiceId}`);
}
