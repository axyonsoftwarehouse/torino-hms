import { createClient } from "@/lib/supabase/server";

import type { EncounterFilter } from "./schema";

export type EncounterListItem = {
  id: string;
  started_at: string;
  closed_at: string | null;
  status: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  diagnosis_code: string | null;
  patient_id: string;
  patient_name: string | null;
  professional_id: string | null;
  professional_name: string | null;
};

export type EncounterDetail = EncounterListItem & {
  notes: string | null;
  appointment_id: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  blood_pressure: string | null;
  temperature_c: number | null;
  heart_rate: number | null;
};

type Named = { full_name: string };

type ListRow = Omit<EncounterListItem, "patient_name" | "professional_name"> & {
  patient: Named | Named[] | null;
  professional: Named | Named[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapRow(row: ListRow): EncounterListItem {
  return {
    id: row.id,
    started_at: row.started_at,
    closed_at: row.closed_at,
    status: row.status,
    chief_complaint: row.chief_complaint,
    diagnosis: row.diagnosis,
    diagnosis_code: row.diagnosis_code,
    patient_id: row.patient_id,
    patient_name: first(row.patient)?.full_name ?? null,
    professional_id: row.professional_id,
    professional_name: first(row.professional)?.full_name ?? null,
  };
}

const SELECT =
  "id, started_at, closed_at, status, chief_complaint, diagnosis, diagnosis_code, patient_id, professional_id, patient:patients(full_name), professional:professionals(full_name)";

export async function listEncounters(
  tenantId: string | null,
  filter: EncounterFilter = "open",
): Promise<EncounterListItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("encounters")
    .select(SELECT)
    .eq("tenant_id", tenantId);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query.order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as ListRow));
}

export async function getEncounter(id: string): Promise<EncounterDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("encounters")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as EncounterDetail;
}

export async function listPatientEncounters(
  patientId: string,
  excludeId?: string,
): Promise<EncounterListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("encounters")
    .select(SELECT)
    .eq("patient_id", patientId)
    .order("started_at", { ascending: false });

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as ListRow));
}
