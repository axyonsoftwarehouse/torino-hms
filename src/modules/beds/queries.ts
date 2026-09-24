import { createClient } from "@/lib/supabase/server";

import type { AssignmentFilter } from "./schema";

type Named = { name: string };
type FullName = { full_name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type BedCategoryItem = {
  id: string;
  name: string;
  description: string | null;
};

export type BedItem = {
  id: string;
  number: string;
  description: string | null;
  status: string;
  category_id: string | null;
  category_name: string | null;
  daily_rate_cents: number;
  patient_name: string | null;
};

export type AssignmentItem = {
  id: string;
  bed_id: string;
  bed_number: string | null;
  category_name: string | null;
  patient_id: string;
  patient_name: string | null;
  professional_name: string | null;
  admitted_at: string;
  discharged_at: string | null;
  status: string;
  diagnosis: string | null;
};

export async function listBedCategories(
  tenantId: string | null,
): Promise<BedCategoryItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bed_categories")
    .select("id, name, description")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as BedCategoryItem[];
}

export async function listBeds(tenantId: string | null): Promise<BedItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();

  const [{ data: beds }, { data: assignments }] = await Promise.all([
    supabase
      .from("beds")
      .select(
        "id, number, description, status, category_id, daily_rate_cents, category:bed_categories(name)",
      )
      .eq("tenant_id", tenantId)
      .order("number"),
    supabase
      .from("bed_assignments")
      .select("bed_id, patient:patients(full_name)")
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
  ]);

  const patientByBed = new Map<string, string>();
  for (const row of assignments ?? []) {
    const patient = first<FullName>(row.patient as FullName | FullName[] | null);
    if (patient) patientByBed.set(row.bed_id, patient.full_name);
  }

  type Row = Omit<BedItem, "category_name" | "patient_name"> & {
    category: Named | Named[] | null;
  };

  return (beds ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      number: r.number,
      description: r.description,
      status: r.status,
      category_id: r.category_id,
      category_name: first(r.category)?.name ?? null,
      daily_rate_cents: r.daily_rate_cents,
      patient_name: patientByBed.get(r.id) ?? null,
    };
  });
}

export type AssignmentDetail = AssignmentItem & {
  notes: string | null;
  discharges: {
    id: string;
    discharged_at: string;
    final_diagnosis: string | null;
    summary: string | null;
    instructions: string | null;
  }[];
};

const ASSIGNMENT_SELECT =
  "id, bed_id, patient_id, professional_id, admitted_at, discharged_at, status, diagnosis, notes, bed:beds(number, category:bed_categories(name)), patient:patients(full_name), professional:professionals(full_name)";

type AssignmentRow = {
  id: string;
  bed_id: string;
  patient_id: string;
  admitted_at: string;
  discharged_at: string | null;
  status: string;
  diagnosis: string | null;
  notes?: string | null;
  bed: { number: string; category: Named | Named[] | null } | null;
  patient: FullName | FullName[] | null;
  professional: FullName | FullName[] | null;
};

function mapAssignment(row: AssignmentRow): AssignmentItem {
  const bed = first(row.bed);
  return {
    id: row.id,
    bed_id: row.bed_id,
    bed_number: bed?.number ?? null,
    category_name: first(bed?.category as Named | Named[] | null)?.name ?? null,
    patient_id: row.patient_id,
    patient_name: first(row.patient)?.full_name ?? null,
    professional_name: first(row.professional)?.full_name ?? null,
    admitted_at: row.admitted_at,
    discharged_at: row.discharged_at,
    status: row.status,
    diagnosis: row.diagnosis,
  };
}

export async function listAssignments(
  tenantId: string | null,
  filter: AssignmentFilter = "active",
): Promise<AssignmentItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  let query = supabase
    .from("bed_assignments")
    .select(ASSIGNMENT_SELECT)
    .eq("tenant_id", tenantId);

  if (filter !== "all") query = query.eq("status", filter);

  const { data, error } = await query.order("admitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapAssignment(row as unknown as AssignmentRow));
}

export async function getAssignment(
  id: string,
): Promise<AssignmentDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bed_assignments")
    .select(ASSIGNMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: discharges } = await supabase
    .from("bed_discharges")
    .select("id, discharged_at, final_diagnosis, summary, instructions")
    .eq("assignment_id", id)
    .order("discharged_at", { ascending: false });

  const row = data as unknown as AssignmentRow;
  return {
    ...mapAssignment(row),
    notes: row.notes ?? null,
    discharges: discharges ?? [],
  };
}

export async function listAvailableBeds(
  tenantId: string | null,
): Promise<{ id: string; number: string; category_name: string | null }[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beds")
    .select("id, number, category:bed_categories(name)")
    .eq("tenant_id", tenantId)
    .eq("status", "available")
    .order("number");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as { id: string; number: string; category: Named | Named[] | null };
    return {
      id: r.id,
      number: r.number,
      category_name: first(r.category)?.name ?? null,
    };
  });
}
