import { createClient } from "@/lib/supabase/server";

export type ReportRange = { start: string; end: string };

export type MethodTotal = { method: string; total: number; count: number };
export type CategoryTotal = { name: string; total: number };
export type ProfessionalTotal = {
  name: string;
  appointments: number;
  revenueCents: number;
};
export type StatusTotal = { status: string; count: number };

export type FinancialReport = {
  receivedCents: number;
  invoicedCents: number;
  expenseCents: number;
  resultCents: number;
  appointmentCount: number;
  byMethod: MethodTotal[];
  byExpenseCategory: CategoryTotal[];
  byProfessional: ProfessionalTotal[];
  appointmentsByStatus: StatusTotal[];
};

const EMPTY: FinancialReport = {
  receivedCents: 0,
  invoicedCents: 0,
  expenseCents: 0,
  resultCents: 0,
  appointmentCount: 0,
  byMethod: [],
  byExpenseCategory: [],
  byProfessional: [],
  appointmentsByStatus: [],
};

export async function getFinancialReport(
  tenantId: string | null,
  range: ReportRange,
): Promise<FinancialReport> {
  if (!tenantId) return EMPTY;

  const startIso = new Date(`${range.start}T00:00`).toISOString();
  const endExclusive = new Date(`${range.end}T00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  const endIso = endExclusive.toISOString();

  const supabase = await createClient();

  const [payments, invoices, expenses, categories, appointments, professionals] =
    await Promise.all([
      supabase
        .from("payments")
        .select("amount_cents, method")
        .eq("tenant_id", tenantId)
        .gte("paid_at", startIso)
        .lt("paid_at", endIso),
      supabase
        .from("invoices")
        .select("total_cents, status")
        .eq("tenant_id", tenantId)
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .in("status", ["issued", "paid"]),
      supabase
        .from("expenses")
        .select("amount_cents, category_id")
        .eq("tenant_id", tenantId)
        .gte("spent_at", range.start)
        .lte("spent_at", range.end),
      supabase
        .from("expense_categories")
        .select("id, name")
        .eq("tenant_id", tenantId),
      supabase
        .from("appointments")
        .select("status, professional_id, fee_cents")
        .eq("tenant_id", tenantId)
        .gte("scheduled_start", startIso)
        .lt("scheduled_start", endIso),
      supabase
        .from("professionals")
        .select("id, full_name")
        .eq("tenant_id", tenantId),
    ]);

  const receivedCents = (payments.data ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );
  const invoicedCents = (invoices.data ?? []).reduce(
    (sum, row) => sum + (row.total_cents ?? 0),
    0,
  );
  const expenseCents = (expenses.data ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );

  const methodMap = new Map<string, { total: number; count: number }>();
  for (const row of payments.data ?? []) {
    const method = row.method ?? "other";
    const current = methodMap.get(method) ?? { total: 0, count: 0 };
    current.total += row.amount_cents ?? 0;
    current.count += 1;
    methodMap.set(method, current);
  }

  const categoryNames = new Map(
    (categories.data ?? []).map((category) => [category.id, category.name]),
  );
  const expenseCategoryMap = new Map<string, number>();
  for (const row of expenses.data ?? []) {
    const name = row.category_id
      ? categoryNames.get(row.category_id) ?? "Sem categoria"
      : "Sem categoria";
    expenseCategoryMap.set(name, (expenseCategoryMap.get(name) ?? 0) + (row.amount_cents ?? 0));
  }

  const professionalNames = new Map(
    (professionals.data ?? []).map((professional) => [
      professional.id,
      professional.full_name,
    ]),
  );

  const statusMap = new Map<string, number>();
  const professionalMap = new Map<string, { appointments: number; revenueCents: number }>();
  for (const row of appointments.data ?? []) {
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);

    if (row.status === "completed") {
      const name = row.professional_id
        ? professionalNames.get(row.professional_id) ?? "Sem profissional"
        : "Sem profissional";
      const current = professionalMap.get(name) ?? { appointments: 0, revenueCents: 0 };
      current.appointments += 1;
      current.revenueCents += row.fee_cents ?? 0;
      professionalMap.set(name, current);
    }
  }

  return {
    receivedCents,
    invoicedCents,
    expenseCents,
    resultCents: receivedCents - expenseCents,
    appointmentCount: (appointments.data ?? []).length,
    byMethod: [...methodMap.entries()]
      .map(([method, value]) => ({ method, ...value }))
      .sort((a, b) => b.total - a.total),
    byExpenseCategory: [...expenseCategoryMap.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total),
    byProfessional: [...professionalMap.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.revenueCents - a.revenueCents),
    appointmentsByStatus: [...statusMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
  };
}
