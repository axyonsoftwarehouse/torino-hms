import { createClient } from "@/lib/supabase/server";

type Named = { name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type EquipmentCategoryItem = {
  id: string;
  name: string;
  description: string | null;
};

export type EquipmentListItem = {
  id: string;
  name: string;
  asset_tag: string | null;
  location: string | null;
  category_name: string | null;
  criticality: string;
  status: string;
  next_due_date: string | null;
  open_orders: number;
};

export type MaintenancePlanItem = {
  id: string;
  description: string;
  periodicity_days: number;
  last_done_at: string | null;
  next_due_date: string | null;
  active: boolean;
};

export type ServiceOrderItem = {
  id: string;
  number: string;
  type: string;
  status: string;
  opened_at: string;
  scheduled_at: string | null;
  closed_at: string | null;
  technician: string | null;
  cost_cents: number;
  description: string | null;
  findings: string | null;
  certificate_number: string | null;
  certificate_expires_at: string | null;
};

export type LoanItem = {
  id: string;
  equipment_id: string;
  equipment_name: string | null;
  sector: string;
  patient_reference: string | null;
  delivered_at: string;
  received_by: string | null;
  returned_at: string | null;
  returned_to: string | null;
  condition_out: string | null;
  condition_in: string | null;
  isolation: boolean;
  infection_notes: string | null;
  disinfection_required: boolean;
  disinfection_done: boolean;
  notes: string | null;
  status: string;
};

export type ContractItem = {
  id: string;
  type: string;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  value_cents: number;
  notes: string | null;
};

export type IncidentItem = {
  id: string;
  occurred_at: string;
  description: string;
  severity: string;
  anvisa_notified: boolean;
  notification_number: string | null;
  status: string;
};

export type EquipmentDetail = EquipmentListItem & {
  category_id: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  anvisa_registration: string | null;
  responsible: string | null;
  acquisition_date: string | null;
  acquisition_value_cents: number;
  warranty_until: string | null;
  notes: string | null;
  plans: MaintenancePlanItem[];
  orders: ServiceOrderItem[];
  loans: LoanItem[];
  contracts: ContractItem[];
  incidents: IncidentItem[];
};

export async function listEquipmentCategories(
  tenantId: string | null,
): Promise<EquipmentCategoryItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipment_categories")
    .select("id, name, description")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as EquipmentCategoryItem[];
}

export async function listEquipment(
  tenantId: string | null,
): Promise<EquipmentListItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();

  const [{ data: equipment, error }, { data: plans }, { data: orders }] = await Promise.all([
    supabase
      .from("equipment")
      .select("id, name, asset_tag, location, criticality, status, category:equipment_categories(name)")
      .eq("tenant_id", tenantId)
      .order("name"),
    supabase
      .from("maintenance_plans")
      .select("equipment_id, next_due_date")
      .eq("tenant_id", tenantId)
      .eq("active", true),
    supabase
      .from("service_orders")
      .select("equipment_id, status")
      .eq("tenant_id", tenantId)
      .in("status", ["open", "in_progress"]),
  ]);
  if (error) throw error;

  const nextDue = new Map<string, string>();
  for (const plan of plans ?? []) {
    if (!plan.next_due_date) continue;
    const current = nextDue.get(plan.equipment_id);
    if (!current || plan.next_due_date < current) {
      nextDue.set(plan.equipment_id, plan.next_due_date);
    }
  }

  const openCount = new Map<string, number>();
  for (const order of orders ?? []) {
    openCount.set(order.equipment_id, (openCount.get(order.equipment_id) ?? 0) + 1);
  }

  type Row = Omit<EquipmentListItem, "category_name" | "next_due_date" | "open_orders"> & {
    category: Named | Named[] | null;
  };

  return (equipment ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      name: r.name,
      asset_tag: r.asset_tag,
      location: r.location,
      criticality: r.criticality,
      status: r.status,
      category_name: first(r.category)?.name ?? null,
      next_due_date: nextDue.get(r.id) ?? null,
      open_orders: openCount.get(r.id) ?? 0,
    };
  });
}

export async function getEquipment(id: string): Promise<EquipmentDetail | null> {
  const supabase = await createClient();
  const { data: equipment } = await supabase
    .from("equipment")
    .select("*, category:equipment_categories(name)")
    .eq("id", id)
    .maybeSingle();
  if (!equipment) return null;

  const [{ data: plans }, { data: orders }, { data: loans }, { data: contracts }, { data: incidents }] =
    await Promise.all([
      supabase
        .from("maintenance_plans")
        .select("id, description, periodicity_days, last_done_at, next_due_date, active")
        .eq("equipment_id", id)
        .order("next_due_date", { nullsFirst: false }),
      supabase
        .from("service_orders")
        .select("id, number, type, status, opened_at, scheduled_at, closed_at, technician, cost_cents, description, findings, certificate_number, certificate_expires_at")
        .eq("equipment_id", id)
        .order("opened_at", { ascending: false }),
      supabase
        .from("equipment_loans")
        .select("id, equipment_id, sector, patient_reference, delivered_at, received_by, returned_at, returned_to, condition_out, condition_in, isolation, infection_notes, disinfection_required, disinfection_done, notes, status")
        .eq("equipment_id", id)
        .order("delivered_at", { ascending: false }),
      supabase
        .from("equipment_contracts")
        .select("id, type, provider, start_date, end_date, value_cents, notes")
        .eq("equipment_id", id)
        .order("end_date", { nullsFirst: false }),
      supabase
        .from("equipment_incidents")
        .select("id, occurred_at, description, severity, anvisa_notified, notification_number, status")
        .eq("equipment_id", id)
        .order("occurred_at", { ascending: false }),
    ]);

  const row = equipment as unknown as {
    id: string;
    name: string;
    asset_tag: string | null;
    location: string | null;
    category_id: string | null;
    criticality: string;
    status: string;
    serial_number: string | null;
    manufacturer: string | null;
    model: string | null;
    anvisa_registration: string | null;
    responsible: string | null;
    acquisition_date: string | null;
    acquisition_value_cents: number;
    warranty_until: string | null;
    notes: string | null;
    category: Named | Named[] | null;
  };

  const planRows = (plans ?? []) as MaintenancePlanItem[];
  const orderRows = (orders ?? []) as ServiceOrderItem[];
  const loanRows = ((loans ?? []) as Omit<LoanItem, "equipment_name">[]).map((l) => ({
    ...l,
    equipment_name: row.name,
  }));
  const contractRows = (contracts ?? []) as ContractItem[];
  const incidentRows = (incidents ?? []) as IncidentItem[];

  return {
    id: row.id,
    name: row.name,
    asset_tag: row.asset_tag,
    location: row.location,
    category_id: row.category_id,
    criticality: row.criticality,
    status: row.status,
    serial_number: row.serial_number,
    manufacturer: row.manufacturer,
    model: row.model,
    anvisa_registration: row.anvisa_registration,
    responsible: row.responsible,
    acquisition_date: row.acquisition_date,
    acquisition_value_cents: row.acquisition_value_cents,
    warranty_until: row.warranty_until,
    notes: row.notes,
    category_name: first(row.category)?.name ?? null,
    next_due_date: planRows.map((p) => p.next_due_date).filter(Boolean).sort()[0] ?? null,
    open_orders: orderRows.filter((o) => o.status === "open" || o.status === "in_progress").length,
    plans: planRows,
    orders: orderRows,
    loans: loanRows,
    contracts: contractRows,
    incidents: incidentRows,
  };
}

export async function listLoans(
  tenantId: string | null,
  filter: "active" | "returned" | "all" = "all",
): Promise<LoanItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  let query = supabase
    .from("equipment_loans")
    .select(
      "id, equipment_id, sector, patient_reference, delivered_at, received_by, returned_at, returned_to, condition_out, condition_in, isolation, infection_notes, disinfection_required, disinfection_done, notes, status, equipment:equipment(name)",
    )
    .eq("tenant_id", tenantId);

  if (filter === "active") query = query.eq("status", "loaned");
  if (filter === "returned") query = query.eq("status", "returned");

  const { data, error } = await query.order("delivered_at", { ascending: false });
  if (error) throw error;

  type Row = Omit<LoanItem, "equipment_name"> & { equipment: Named | Named[] | null };
  return (data ?? []).map((row) => {
    const r = row as Row;
    return { ...r, equipment_name: first(r.equipment)?.name ?? null };
  });
}

export type EquipmentIndicators = {
  periodDays: number;
  equipmentCount: number;
  totalOrders: number;
  correctiveOrders: number;
  mttrHours: number;
  downtimeHours: number;
  availability: number;
  incidents: number;
};

export async function getEquipmentIndicators(
  tenantId: string | null,
  days = 90,
): Promise<EquipmentIndicators> {
  const empty: EquipmentIndicators = {
    periodDays: days,
    equipmentCount: 0,
    totalOrders: 0,
    correctiveOrders: 0,
    mttrHours: 0,
    downtimeHours: 0,
    availability: 100,
    incidents: 0,
  };
  if (!tenantId) return empty;

  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [orders, equipmentCount, incidents] = await Promise.all([
    supabase
      .from("service_orders")
      .select("type, status, opened_at, closed_at")
      .eq("tenant_id", tenantId)
      .gte("opened_at", since.toISOString()),
    supabase
      .from("equipment")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .neq("status", "decommissioned"),
    supabase
      .from("equipment_incidents")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("occurred_at", since.toISOString().slice(0, 10)),
  ]);

  let correctiveOrders = 0;
  let downtimeHours = 0;
  for (const order of orders.data ?? []) {
    if (order.type !== "corrective") continue;
    correctiveOrders += 1;
    if (order.closed_at && order.opened_at) {
      const hours =
        (new Date(order.closed_at).getTime() - new Date(order.opened_at).getTime()) / 3600000;
      if (hours > 0) downtimeHours += hours;
    }
  }

  const equipmentTotal = equipmentCount.count ?? 0;
  const mttrHours = correctiveOrders > 0 ? downtimeHours / correctiveOrders : 0;
  const availableHours = (equipmentTotal || 1) * days * 24;
  const availability = Math.max(
    0,
    Math.min(100, (1 - downtimeHours / availableHours) * 100),
  );

  return {
    periodDays: days,
    equipmentCount: equipmentTotal,
    totalOrders: (orders.data ?? []).length,
    correctiveOrders,
    mttrHours,
    downtimeHours,
    availability,
    incidents: incidents.count ?? 0,
  };
}

export async function countDueMaintenance(
  tenantId: string | null,
  days = 30,
): Promise<number> {
  if (!tenantId) return 0;
  const supabase = await createClient();
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  const { count } = await supabase
    .from("maintenance_plans")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .not("next_due_date", "is", null)
    .lte("next_due_date", limit.toISOString().slice(0, 10));
  return count ?? 0;
}
