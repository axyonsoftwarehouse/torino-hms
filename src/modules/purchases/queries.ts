import { createClient } from "@/lib/supabase/server";

import type { PurchaseFilter } from "./schema";

type Named = { name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type PurchaseOrderListItem = {
  id: string;
  number: string;
  supplier_name: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  total_cents: number;
  paid_cents: number;
  payment_status: string;
};

export type PurchaseItemRow = {
  id: string;
  medicine_id: string | null;
  medicine_name: string | null;
  description: string | null;
  quantity: number;
  unit_cost_cents: number;
  total_cents: number;
  expiry_date: string | null;
  batch_number: string | null;
};

export type PurchasePaymentRow = {
  id: string;
  amount_cents: number;
  method: string;
  paid_at: string;
  reference: string | null;
  notes: string | null;
};

export type PurchaseOrderDetail = {
  id: string;
  number: string;
  status: string;
  supplier_id: string | null;
  supplier_name: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_cents: number;
  notes: string | null;
  items: PurchaseItemRow[];
  payments: PurchasePaymentRow[];
  paid_cents: number;
};

function paymentStatus(status: string, total: number, paid: number): string {
  if (status === "canceled") return "canceled";
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

export async function listPurchaseOrders(
  tenantId: string | null,
  filter: PurchaseFilter = "all",
): Promise<PurchaseOrderListItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("purchase_orders")
    .select(
      "id, number, order_date, expected_delivery_date, status, total_cents, supplier:suppliers(name)",
    )
    .eq("tenant_id", tenantId);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const [{ data: orders, error }, { data: payments }] = await Promise.all([
    query.order("order_date", { ascending: false }),
    supabase
      .from("purchase_payments")
      .select("purchase_order_id, amount_cents")
      .eq("tenant_id", tenantId),
  ]);

  if (error) throw error;

  const paidByOrder = new Map<string, number>();
  for (const payment of payments ?? []) {
    paidByOrder.set(
      payment.purchase_order_id,
      (paidByOrder.get(payment.purchase_order_id) ?? 0) + (payment.amount_cents ?? 0),
    );
  }

  type Row = {
    id: string;
    number: string;
    order_date: string;
    expected_delivery_date: string | null;
    status: string;
    total_cents: number;
    supplier: Named | Named[] | null;
  };

  return (orders ?? []).map((row) => {
    const r = row as Row;
    const paid = paidByOrder.get(r.id) ?? 0;
    return {
      id: r.id,
      number: r.number,
      supplier_name: first(r.supplier)?.name ?? null,
      order_date: r.order_date,
      expected_delivery_date: r.expected_delivery_date,
      status: r.status,
      total_cents: r.total_cents,
      paid_cents: paid,
      payment_status: paymentStatus(r.status, r.total_cents, paid),
    };
  });
}

export async function getPurchaseOrder(
  id: string,
): Promise<PurchaseOrderDetail | null> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(name)")
    .eq("id", id)
    .maybeSingle();

  if (!order) return null;

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase
      .from("purchase_order_items")
      .select(
        "id, medicine_id, description, quantity, unit_cost_cents, total_cents, expiry_date, batch_number, medicine:medicines(name)",
      )
      .eq("purchase_order_id", id)
      .order("created_at"),
    supabase
      .from("purchase_payments")
      .select("id, amount_cents, method, paid_at, reference, notes")
      .eq("purchase_order_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  const orderRow = order as Record<string, unknown> & {
    supplier: Named | Named[] | null;
  };

  const itemRows: PurchaseItemRow[] = (items ?? []).map((row) => {
    const r = row as Record<string, unknown> & { medicine: Named | Named[] | null };
    return {
      id: r.id as string,
      medicine_id: (r.medicine_id as string | null) ?? null,
      medicine_name: first(r.medicine)?.name ?? null,
      description: (r.description as string | null) ?? null,
      quantity: r.quantity as number,
      unit_cost_cents: r.unit_cost_cents as number,
      total_cents: r.total_cents as number,
      expiry_date: (r.expiry_date as string | null) ?? null,
      batch_number: (r.batch_number as string | null) ?? null,
    };
  });

  const paymentRows = (payments ?? []) as PurchasePaymentRow[];

  return {
    id: orderRow.id as string,
    number: orderRow.number as string,
    status: orderRow.status as string,
    supplier_id: (orderRow.supplier_id as string | null) ?? null,
    supplier_name: first(orderRow.supplier)?.name ?? null,
    order_date: orderRow.order_date as string,
    expected_delivery_date: (orderRow.expected_delivery_date as string | null) ?? null,
    received_at: (orderRow.received_at as string | null) ?? null,
    invoice_number: (orderRow.invoice_number as string | null) ?? null,
    invoice_date: (orderRow.invoice_date as string | null) ?? null,
    total_cents: orderRow.total_cents as number,
    notes: (orderRow.notes as string | null) ?? null,
    items: itemRows,
    payments: paymentRows,
    paid_cents: paymentRows.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0),
  };
}
