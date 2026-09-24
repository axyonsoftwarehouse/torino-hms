import { createClient } from "@/lib/supabase/server";

export type ProfessionalItem = {
  id: string;
  full_name: string;
  speciality: string | null;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  fee_cents: number;
  department_id: string | null;
  department_name: string | null;
  bio?: string | null;
};

type ProfessionalRow = Omit<ProfessionalItem, "department_name"> & {
  department: { name: string } | { name: string }[] | null;
};

function mapRow(row: ProfessionalRow): ProfessionalItem {
  const department = Array.isArray(row.department)
    ? row.department[0]
    : row.department;
  return { ...row, department_name: department?.name ?? null };
}

const SELECT =
  "id, full_name, speciality, license_number, phone, email, active, fee_cents, department_id, department:departments(name)";

export async function listProfessionals(
  tenantId: string | null,
): Promise<ProfessionalItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .order("full_name");

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as ProfessionalRow));
}

export async function getProfessional(
  id: string,
): Promise<ProfessionalItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as ProfessionalRow);
}

export async function listProfessionalOptions(
  tenantId: string | null,
): Promise<{ id: string; full_name: string }[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select("id, full_name")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}
