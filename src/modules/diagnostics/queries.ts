import { createClient } from "@/lib/supabase/server";

import type { ExamFilter } from "./schema";

type Named = { name: string };
type FullName = { full_name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type ExamCategoryItem = {
  id: string;
  kind: string;
  name: string;
  description: string | null;
};

export type ExamTestItem = {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  price_cents: number;
  duration_minutes: number | null;
};

export type ExamOrderListItem = {
  id: string;
  order_number: string;
  kind: string;
  urgency: string;
  status: string;
  order_date: string;
  total_cents: number;
  patient_name: string | null;
  professional_name: string | null;
};

export type ExamOrderItemRow = {
  id: string;
  test_id: string | null;
  test_name: string;
  quantity: number;
  price_cents: number;
  subtotal_cents: number;
  status: string;
  result: string | null;
  reference_value: string | null;
};

export type ExamOrderDetail = ExamOrderListItem & {
  patient_id: string;
  professional_id: string | null;
  clinical_notes: string | null;
  items: ExamOrderItemRow[];
};

export async function listExamCategories(
  tenantId: string | null,
): Promise<ExamCategoryItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_categories")
    .select("id, kind, name, description")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as ExamCategoryItem[];
}

export async function listExamTests(
  tenantId: string | null,
): Promise<ExamTestItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_tests")
    .select("id, name, category_id, price_cents, duration_minutes, category:exam_categories(name)")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;

  type Row = Omit<ExamTestItem, "category_name"> & {
    category: Named | Named[] | null;
  };
  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      name: r.name,
      category_id: r.category_id,
      price_cents: r.price_cents,
      duration_minutes: r.duration_minutes,
      category_name: first(r.category)?.name ?? null,
    };
  });
}

export async function listExamOrders(
  tenantId: string | null,
  filter: ExamFilter = "all",
): Promise<ExamOrderListItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  let query = supabase
    .from("exam_orders")
    .select(
      "id, order_number, kind, urgency, status, order_date, total_cents, patient:patients(full_name), professional:professionals(full_name)",
    )
    .eq("tenant_id", tenantId);

  if (filter !== "all") query = query.eq("status", filter);

  const { data, error } = await query.order("order_date", { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    order_number: string;
    kind: string;
    urgency: string;
    status: string;
    order_date: string;
    total_cents: number;
    patient: FullName | FullName[] | null;
    professional: FullName | FullName[] | null;
  };

  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      order_number: r.order_number,
      kind: r.kind,
      urgency: r.urgency,
      status: r.status,
      order_date: r.order_date,
      total_cents: r.total_cents,
      patient_name: first(r.patient)?.full_name ?? null,
      professional_name: first(r.professional)?.full_name ?? null,
    };
  });
}

export async function getExamOrder(id: string): Promise<ExamOrderDetail | null> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("exam_orders")
    .select(
      "id, order_number, kind, urgency, status, order_date, total_cents, patient_id, professional_id, clinical_notes, patient:patients(full_name), professional:professionals(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("exam_order_items")
    .select(
      "id, test_id, test_name, quantity, price_cents, subtotal_cents, status, result, test:exam_tests(reference_value)",
    )
    .eq("order_id", id)
    .order("created_at");

  const orderRow = order as unknown as {
    id: string;
    order_number: string;
    kind: string;
    urgency: string;
    status: string;
    order_date: string;
    total_cents: number;
    patient_id: string;
    professional_id: string | null;
    clinical_notes: string | null;
    patient: FullName | FullName[] | null;
    professional: FullName | FullName[] | null;
  };

  const itemRows: ExamOrderItemRow[] = (items ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      test_id: string | null;
      test_name: string;
      quantity: number;
      price_cents: number;
      subtotal_cents: number;
      status: string;
      result: string | null;
      test: { reference_value: string | null } | { reference_value: string | null }[] | null;
    };
    return {
      id: r.id,
      test_id: r.test_id,
      test_name: r.test_name,
      quantity: r.quantity,
      price_cents: r.price_cents,
      subtotal_cents: r.subtotal_cents,
      status: r.status,
      result: r.result,
      reference_value: first(r.test)?.reference_value ?? null,
    };
  });

  return {
    id: orderRow.id,
    order_number: orderRow.order_number,
    kind: orderRow.kind,
    urgency: orderRow.urgency,
    status: orderRow.status,
    order_date: orderRow.order_date,
    total_cents: orderRow.total_cents,
    patient_name: first(orderRow.patient)?.full_name ?? null,
    professional_name: first(orderRow.professional)?.full_name ?? null,
    patient_id: orderRow.patient_id,
    professional_id: orderRow.professional_id,
    clinical_notes: orderRow.clinical_notes,
    items: itemRows,
  };
}
