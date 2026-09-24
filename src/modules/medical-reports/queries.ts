import { createClient } from "@/lib/supabase/server";

import type { ReportFilter } from "./schema";

export type MedicalReportListItem = {
  id: string;
  report_type: string;
  title: string | null;
  report_date: string;
  patient_id: string;
  patient_name: string | null;
  professional_name: string | null;
};

export type MedicalReportDetail = MedicalReportListItem & {
  description: string | null;
  professional_id: string | null;
  encounter_id: string | null;
};

type Named = { full_name: string };
type Row = Omit<MedicalReportListItem, "patient_name" | "professional_name"> & {
  patient: Named | Named[] | null;
  professional: Named | Named[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const SELECT =
  "id, report_type, title, report_date, patient_id, patient:patients(full_name), professional:professionals(full_name)";

function mapRow(row: Row): MedicalReportListItem {
  return {
    id: row.id,
    report_type: row.report_type,
    title: row.title,
    report_date: row.report_date,
    patient_id: row.patient_id,
    patient_name: first(row.patient)?.full_name ?? null,
    professional_name: first(row.professional)?.full_name ?? null,
  };
}

export async function listMedicalReports(
  tenantId: string | null,
  filter: ReportFilter = "all",
): Promise<MedicalReportListItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("medical_reports")
    .select(SELECT)
    .eq("tenant_id", tenantId);

  if (filter !== "all") {
    query = query.eq("report_type", filter);
  }

  const { data, error } = await query.order("report_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Row));
}

export async function getMedicalReport(
  id: string,
): Promise<MedicalReportDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medical_reports")
    .select(
      "id, report_type, title, report_date, patient_id, professional_id, encounter_id, description, patient:patients(full_name), professional:professionals(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Row & {
    professional_id: string | null;
    encounter_id: string | null;
    description: string | null;
  };

  return {
    ...mapRow(row),
    description: row.description,
    professional_id: row.professional_id,
    encounter_id: row.encounter_id,
  };
}
