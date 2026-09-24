import { createClient } from "@/lib/supabase/server";

import type { SaasInvoiceStatus } from "./schema";

type Named = { name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type PlanItem = {
  key: string;
  name: string;
  monthly_price_cents: number;
  annual_price_cents: number;
  active: boolean;
};

export type SubscriptionItem = {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  plan_key: string;
  plan_name: string | null;
  cycle: string;
  amount_cents: number;
  status: string;
  started_at: string;
  next_due_date: string | null;
  notes: string | null;
};

export type SaasInvoiceListItem = {
  id: string;
  number: string;
  tenant_id: string;
  tenant_name: string | null;
  status: string;
  total_cents: number;
  due_date: string | null;
  created_at: string;
  paid_cents: number;
};

export type SaasInvoiceDetail = SaasInvoiceListItem & {
  issued_at: string | null;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  coupon_code: string | null;
  discount_cents: number;
  items: { id: string; description: string; quantity: number; unit_price_cents: number; total_cents: number }[];
  payments: { id: string; amount_cents: number; method: string; paid_at: string; reference: string | null }[];
  adjustments: { id: string; kind: string; amount_cents: number; reason: string | null }[];
  credits_cents: number;
  debits_cents: number;
  refunds_cents: number;
};

export type CouponItem = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  active: boolean;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number;
};

export async function listCoupons(): Promise<CouponItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, description, discount_type, discount_value, active, valid_until, max_uses, used_count")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CouponItem[];
}

export async function listPlans(): Promise<PlanItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saas_plans")
    .select("key, name, monthly_price_cents, annual_price_cents, active")
    .order("monthly_price_cents");
  if (error) throw error;
  return (data ?? []) as PlanItem[];
}

export async function listSubscriptions(): Promise<SubscriptionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, tenant_id, plan_key, cycle, amount_cents, status, started_at, next_due_date, notes, tenant:tenants(name), plan:saas_plans(name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    tenant_id: string;
    plan_key: string;
    cycle: string;
    amount_cents: number;
    status: string;
    started_at: string;
    next_due_date: string | null;
    notes: string | null;
    tenant: Named | Named[] | null;
    plan: Named | Named[] | null;
  };

  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      tenant_id: r.tenant_id,
      tenant_name: first(r.tenant)?.name ?? null,
      plan_key: r.plan_key,
      plan_name: first(r.plan)?.name ?? null,
      cycle: r.cycle,
      amount_cents: r.amount_cents,
      status: r.status,
      started_at: r.started_at,
      next_due_date: r.next_due_date,
      notes: r.notes,
    };
  });
}

export async function getSubscriptionByTenant(
  tenantId: string,
): Promise<SubscriptionItem | null> {
  const all = await listSubscriptions();
  return all.find((s) => s.tenant_id === tenantId) ?? null;
}

export async function listSaasInvoices(
  status?: SaasInvoiceStatus | "all",
): Promise<SaasInvoiceListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("saas_invoices")
    .select("id, number, tenant_id, status, total_cents, due_date, created_at, tenant:tenants(name)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const [{ data: invoices, error }, { data: payments }] = await Promise.all([
    query,
    supabase.from("saas_payments").select("invoice_id, amount_cents"),
  ]);
  if (error) throw error;

  const paidByInvoice = new Map<string, number>();
  for (const payment of payments ?? []) {
    paidByInvoice.set(
      payment.invoice_id,
      (paidByInvoice.get(payment.invoice_id) ?? 0) + (payment.amount_cents ?? 0),
    );
  }

  type Row = {
    id: string;
    number: string;
    tenant_id: string;
    status: string;
    total_cents: number;
    due_date: string | null;
    created_at: string;
    tenant: Named | Named[] | null;
  };

  return (invoices ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      number: r.number,
      tenant_id: r.tenant_id,
      tenant_name: first(r.tenant)?.name ?? null,
      status: r.status,
      total_cents: r.total_cents,
      due_date: r.due_date,
      created_at: r.created_at,
      paid_cents: paidByInvoice.get(r.id) ?? 0,
    };
  });
}

export async function getSaasInvoice(id: string): Promise<SaasInvoiceDetail | null> {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("saas_invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!invoice) return null;

  const [{ data: items }, { data: payments }, { data: adjustments }, { data: tenant }] =
    await Promise.all([
      supabase
        .from("saas_invoice_items")
        .select("id, description, quantity, unit_price_cents, total_cents")
        .eq("invoice_id", id)
        .order("created_at"),
      supabase
        .from("saas_payments")
        .select("id, amount_cents, method, paid_at, reference")
        .eq("invoice_id", id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("saas_adjustments")
        .select("id, kind, amount_cents, reason")
        .eq("invoice_id", id)
        .order("created_at"),
      invoice.tenant_id
        ? supabase.from("tenants").select("name").eq("id", invoice.tenant_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const adjustmentRows = (adjustments ?? []) as {
    id: string;
    kind: string;
    amount_cents: number;
    reason: string | null;
  }[];
  const paymentRows = (payments ?? []) as SaasInvoiceDetail["payments"];

  const sum = (kind: string) =>
    adjustmentRows
      .filter((a) => a.kind === kind)
      .reduce((total, a) => total + a.amount_cents, 0);

  return {
    id: invoice.id,
    number: invoice.number,
    tenant_id: invoice.tenant_id,
    tenant_name: tenant?.name ?? null,
    status: invoice.status,
    total_cents: invoice.total_cents,
    due_date: invoice.due_date,
    created_at: invoice.created_at,
    issued_at: invoice.issued_at,
    period_start: invoice.period_start,
    period_end: invoice.period_end,
    notes: invoice.notes,
    coupon_code: invoice.coupon_code ?? null,
    discount_cents: invoice.discount_cents ?? 0,
    items: (items ?? []) as SaasInvoiceDetail["items"],
    payments: paymentRows,
    adjustments: adjustmentRows,
    paid_cents: paymentRows.reduce((total, p) => total + p.amount_cents, 0),
    credits_cents: sum("credit"),
    debits_cents: sum("debit"),
    refunds_cents: sum("refund"),
  };
}

export type BillingSummary = {
  mrrCents: number;
  receivedThisMonthCents: number;
  openCents: number;
  overdueCount: number;
  activeSubscriptions: number;
};

export async function getBillingSummary(): Promise<BillingSummary> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStr = now.toISOString().slice(0, 10);

  const [subscriptions, payments, invoices] = await Promise.all([
    supabase.from("subscriptions").select("cycle, amount_cents, status"),
    supabase
      .from("saas_payments")
      .select("amount_cents")
      .gte("paid_at", monthStart.toISOString().slice(0, 10)),
    supabase.from("saas_invoices").select("status, total_cents, due_date"),
  ]);

  let mrrCents = 0;
  let activeSubscriptions = 0;
  for (const sub of subscriptions.data ?? []) {
    if (sub.status === "active" || sub.status === "past_due") {
      activeSubscriptions += 1;
      mrrCents +=
        sub.cycle === "annual" ? Math.round((sub.amount_cents ?? 0) / 12) : sub.amount_cents ?? 0;
    }
  }

  const receivedThisMonthCents = (payments.data ?? []).reduce(
    (total, p) => total + (p.amount_cents ?? 0),
    0,
  );

  let openCents = 0;
  let overdueCount = 0;
  for (const invoice of invoices.data ?? []) {
    if (invoice.status === "issued") {
      openCents += invoice.total_cents ?? 0;
      if (invoice.due_date && invoice.due_date < todayStr) overdueCount += 1;
    }
  }

  return { mrrCents, receivedThisMonthCents, openCents, overdueCount, activeSubscriptions };
}
