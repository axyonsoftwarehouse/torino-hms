import { createClient } from "@/lib/supabase/server";

export type AppointmentItem = {
  id: string;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
  type: string | null;
  reason: string | null;
  fee_cents: number;
  patient_id: string;
  patient_name: string | null;
  professional_id: string | null;
  professional_name: string | null;
};

export type AppointmentFilter = "today" | "upcoming" | "all";

const SELECT =
  "id, scheduled_start, scheduled_end, status, type, reason, fee_cents, patient_id, professional_id, patient:patients(full_name), professional:professionals(full_name)";

type Named = { full_name: string };
type AppointmentRow = Omit<
  AppointmentItem,
  "patient_name" | "professional_name"
> & {
  patient: Named | Named[] | null;
  professional: Named | Named[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapRow(row: AppointmentRow): AppointmentItem {
  return {
    id: row.id,
    scheduled_start: row.scheduled_start,
    scheduled_end: row.scheduled_end,
    status: row.status,
    type: row.type,
    reason: row.reason,
    fee_cents: row.fee_cents,
    patient_id: row.patient_id,
    patient_name: first(row.patient)?.full_name ?? null,
    professional_id: row.professional_id,
    professional_name: first(row.professional)?.full_name ?? null,
  };
}

export async function listAppointments(
  tenantId: string | null,
  filter: AppointmentFilter = "upcoming",
): Promise<AppointmentItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(SELECT)
    .eq("tenant_id", tenantId);

  if (filter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query
      .gte("scheduled_start", start.toISOString())
      .lt("scheduled_start", end.toISOString());
  } else if (filter === "upcoming") {
    query = query.gte("scheduled_start", new Date().toISOString());
  }

  query = query.order("scheduled_start", { ascending: filter !== "all" });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as AppointmentRow));
}

export type DayAppointment = {
  id: string;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
  patient_name: string | null;
};

export async function listDayAppointments(
  professionalId: string,
  dateStr: string,
): Promise<DayAppointment[]> {
  const base = new Date(`${dateStr}T00:00`);
  if (Number.isNaN(base.getTime())) return [];
  const end = new Date(base);
  end.setDate(end.getDate() + 1);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, scheduled_start, scheduled_end, status, patient:patients(full_name)")
    .eq("professional_id", professionalId)
    .gte("scheduled_start", base.toISOString())
    .lt("scheduled_start", end.toISOString())
    .order("scheduled_start");

  if (error) throw error;

  type Row = {
    id: string;
    scheduled_start: string;
    scheduled_end: string | null;
    status: string;
    patient: Named | Named[] | null;
  };

  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      scheduled_start: r.scheduled_start,
      scheduled_end: r.scheduled_end,
      status: r.status,
      patient_name: first(r.patient)?.full_name ?? null,
    };
  });
}

export type PatientAppointment = {
  id: string;
  scheduled_start: string;
  status: string;
  type: string | null;
  professional_name: string | null;
};

export async function listPatientAppointments(
  patientId: string,
  limit = 10,
): Promise<PatientAppointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, scheduled_start, status, type, professional:professionals(full_name)")
    .eq("patient_id", patientId)
    .order("scheduled_start", { ascending: false })
    .limit(limit);

  if (error) throw error;

  type Row = {
    id: string;
    scheduled_start: string;
    status: string;
    type: string | null;
    professional: Named | Named[] | null;
  };

  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      scheduled_start: r.scheduled_start,
      status: r.status,
      type: r.type,
      professional_name: first(r.professional)?.full_name ?? null,
    };
  });
}
