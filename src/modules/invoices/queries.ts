import { createClient } from "@/lib/supabase/server";

import type { InvoiceFilter } from "./schema";

export type InvoiceListItem = {
  id: string;
  number: string | null;
  status: string;
  total_cents: number;
  due_date: string | null;
  created_at: string;
  patient_id: string | null;
  patient_name: string | null;
};

export type InvoiceItemRow = {
  id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

export type PaymentRow = {
  id: string;
  amount_cents: number;
  method: string;
  paid_at: string;
  notes: string | null;
};

export type InvoiceDetail = {
  id: string;
  number: string | null;
  status: string;
  total_cents: number;
  due_date: string | null;
  issued_at: string | null;
  created_at: string;
  patient_id: string | null;
  patient_name: string | null;
  encounter_id: string | null;
  items: InvoiceItemRow[];
  payments: PaymentRow[];
  paid_cents: number;
};

type Named = { full_name: string };
type ListRow = Omit<InvoiceListItem, "patient_name"> & {
  patient: Named | Named[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listInvoices(
  tenantId: string | null,
  filter: InvoiceFilter = "all",
): Promise<InvoiceListItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("id, number, status, total_cents, due_date, created_at, patient_id, patient:patients(full_name)")
    .eq("tenant_id", tenantId);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as ListRow;
    return {
      id: r.id,
      number: r.number,
      status: r.status,
      total_cents: r.total_cents,
      due_date: r.due_date,
      created_at: r.created_at,
      patient_id: r.patient_id,
      patient_name: first(r.patient)?.full_name ?? null,
    };
  });
}

export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) return null;

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase
      .from("invoice_items")
      .select("id, service_id, description, quantity, unit_price_cents, total_cents")
      .eq("invoice_id", id)
      .order("description"),
    supabase
      .from("payments")
      .select("id, amount_cents, method, paid_at, notes")
      .eq("invoice_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  const { data: patient } = invoice.patient_id
    ? await supabase
        .from("patients")
        .select("full_name")
        .eq("id", invoice.patient_id)
        .maybeSingle()
    : { data: null };

  const paymentRows = (payments ?? []) as PaymentRow[];

  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    total_cents: invoice.total_cents,
    due_date: invoice.due_date,
    issued_at: invoice.issued_at,
    created_at: invoice.created_at,
    patient_id: invoice.patient_id,
    patient_name: patient?.full_name ?? null,
    encounter_id: invoice.encounter_id,
    items: (items ?? []) as InvoiceItemRow[],
    payments: paymentRows,
    paid_cents: paymentRows.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0),
  };
}
