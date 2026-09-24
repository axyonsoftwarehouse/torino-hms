import { createClient } from "@/lib/supabase/server";
import { countDueMaintenance } from "@/modules/equipment/queries";

export type DashboardKpis = {
  patients: number;
  patientsNewMonth: number;
  professionalsActive: number;
  professionalsInactive: number;
  today: number;
  todayCompleted: number;
  upcoming: number;
  nextUpcoming: string | null;
};

export type DayPoint = { label: string; completed: number; other: number };
export type MonthPoint = { label: string; revenueCents: number; expenseCents: number };
export type StatusPoint = { status: string; count: number };
export type DashboardAlert = {
  key: string;
  label: string;
  href: string;
  count: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  last7: DayPoint[];
  months: MonthPoint[];
  statusBreakdown: StatusPoint[];
  alerts: DashboardAlert[];
};

const EMPTY: DashboardData = {
  kpis: {
    patients: 0,
    patientsNewMonth: 0,
    professionalsActive: 0,
    professionalsInactive: 0,
    today: 0,
    todayCompleted: 0,
    upcoming: 0,
    nextUpcoming: null,
  },
  last7: [],
  months: [],
  statusBreakdown: [],
  alerts: [],
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function shortWeekday(date: Date) {
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function shortMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export async function getDashboardData(
  tenantId: string | null,
): Promise<DashboardData> {
  if (!tenantId) return EMPTY;

  const supabase = await createClient();

  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(startToday);
  endToday.setDate(endToday.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const sevenDaysAgo = new Date(startToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const thirtyDaysAgo = new Date(startToday);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    patients,
    patientsNewMonth,
    professionalsActive,
    professionalsInactive,
    today,
    todayCompleted,
    upcoming,
    nextAppt,
    appt7,
    appt30,
    payments,
    expenses,
    medicines,
    batches,
    expiring,
    pendingExams,
    openEncounters,
    activeAssignments,
    openInvoices,
    orderedPurchases,
    dueMaintenance,
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).is("deleted_at", null).gte("created_at", monthStart.toISOString()),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("active", true),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("active", false),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("scheduled_start", startToday.toISOString()).lt("scheduled_start", endToday.toISOString()),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "completed").gte("scheduled_start", startToday.toISOString()).lt("scheduled_start", endToday.toISOString()),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("scheduled_start", endToday.toISOString()),
    supabase.from("appointments").select("scheduled_start").eq("tenant_id", tenantId).gte("scheduled_start", now.toISOString()).order("scheduled_start", { ascending: true }).limit(1),
    supabase.from("appointments").select("scheduled_start, status").eq("tenant_id", tenantId).gte("scheduled_start", sevenDaysAgo.toISOString()).lt("scheduled_start", endToday.toISOString()),
    supabase.from("appointments").select("status").eq("tenant_id", tenantId).gte("scheduled_start", thirtyDaysAgo.toISOString()).lt("scheduled_start", endToday.toISOString()),
    supabase.from("payments").select("amount_cents, paid_at").eq("tenant_id", tenantId).gte("paid_at", sixMonthsAgo.toISOString()),
    supabase.from("expenses").select("amount_cents, spent_at").eq("tenant_id", tenantId).gte("spent_at", `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`),
    supabase.from("medicines").select("id, reorder_level").eq("tenant_id", tenantId),
    supabase.from("medicine_batches").select("medicine_id, quantity").eq("tenant_id", tenantId),
    supabase.from("medicine_batches").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).gt("quantity", 0).not("expiry_date", "is", null).lte("expiry_date", new Date(now.getTime() + 60 * 86400000).toISOString().slice(0, 10)),
    supabase.from("exam_orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending"),
    supabase.from("encounters").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "open"),
    supabase.from("bed_assignments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "issued"),
    supabase.from("purchase_orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "ordered"),
    countDueMaintenance(tenantId, 30),
  ]);

  // Últimos 7 dias
  const dayMap = new Map<string, DayPoint>();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    dayMap.set(dayKey(date), { label: shortWeekday(date), completed: 0, other: 0 });
  }
  for (const row of appt7.data ?? []) {
    const date = new Date(row.scheduled_start);
    const point = dayMap.get(dayKey(date));
    if (!point) continue;
    if (row.status === "completed") point.completed += 1;
    else point.other += 1;
  }
  const last7 = [...dayMap.values()];

  // Receita x despesa (6 meses)
  const monthMap = new Map<string, MonthPoint>();
  const monthOrder: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthMap.set(key, { label: shortMonth(date), revenueCents: 0, expenseCents: 0 });
    monthOrder.push(key);
  }
  for (const row of payments.data ?? []) {
    const date = new Date(row.paid_at);
    const bucket = monthMap.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket.revenueCents += row.amount_cents ?? 0;
  }
  for (const row of expenses.data ?? []) {
    const [year, month] = (row.spent_at as string).split("-").map(Number);
    const bucket = monthMap.get(`${year}-${month - 1}`);
    if (bucket) bucket.expenseCents += row.amount_cents ?? 0;
  }
  const months = monthOrder.map((key) => monthMap.get(key)!).filter(Boolean);

  // Consultas por status (30 dias)
  const statusMap = new Map<string, number>();
  for (const row of appt30.data ?? []) {
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
  }
  const statusBreakdown = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Estoque baixo (por medicamento)
  const stockByMedicine = new Map<string, number>();
  for (const batch of batches.data ?? []) {
    stockByMedicine.set(
      batch.medicine_id,
      (stockByMedicine.get(batch.medicine_id) ?? 0) + (batch.quantity ?? 0),
    );
  }
  let lowStock = 0;
  for (const medicine of medicines.data ?? []) {
    const stock = stockByMedicine.get(medicine.id) ?? 0;
    if (stock <= 0 || (medicine.reorder_level > 0 && stock <= medicine.reorder_level)) {
      lowStock += 1;
    }
  }

  const alerts: DashboardAlert[] = [
    { key: "low_stock", label: "Estoque baixo de medicamentos", href: "/app/pharmacy", count: lowStock },
    { key: "expiring", label: "Lotes vencendo (60 dias)", href: "/app/pharmacy", count: expiring.count ?? 0 },
    { key: "exams", label: "Exames pendentes", href: "/app/diagnostics?status=pending", count: pendingExams.count ?? 0 },
    { key: "encounters", label: "Atendimentos abertos", href: "/app/encounters?status=open", count: openEncounters.count ?? 0 },
    { key: "beds", label: "Internações ativas", href: "/app/beds", count: activeAssignments.count ?? 0 },
    { key: "invoices", label: "Faturas em aberto", href: "/app/finance?status=issued", count: openInvoices.count ?? 0 },
    { key: "purchases", label: "Compras a receber", href: "/app/purchases?status=ordered", count: orderedPurchases.count ?? 0 },
    { key: "equipment", label: "Manutenção/calibração vencendo", href: "/app/equipment", count: dueMaintenance },
  ].filter((alert) => alert.count > 0);

  return {
    kpis: {
      patients: patients.count ?? 0,
      patientsNewMonth: patientsNewMonth.count ?? 0,
      professionalsActive: professionalsActive.count ?? 0,
      professionalsInactive: professionalsInactive.count ?? 0,
      today: today.count ?? 0,
      todayCompleted: todayCompleted.count ?? 0,
      upcoming: upcoming.count ?? 0,
      nextUpcoming: nextAppt.data?.[0]?.scheduled_start ?? null,
    },
    last7,
    months,
    statusBreakdown,
    alerts,
  };
}
