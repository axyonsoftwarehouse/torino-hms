import { createClient } from "@/lib/supabase/server";

export type PatientListItem = {
  id: string;
  full_name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  created_at: string;
  insurance_name: string | null;
};

export type PatientDetail = PatientListItem & {
  gender: string | null;
  address: string | null;
  blood_type: string | null;
  insurance_company_id: string | null;
  insurance_card_number: string | null;
  notes: string | null;
};

type Named = { name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const LIST_SELECT =
  "id, full_name, document, phone, email, birth_date, created_at, insurance_company:insurance_companies(name)";

type ListRow = Omit<PatientListItem, "insurance_name"> & {
  insurance_company: Named | Named[] | null;
};

function mapListRow(row: ListRow): PatientListItem {
  return {
    id: row.id,
    full_name: row.full_name,
    document: row.document,
    phone: row.phone,
    email: row.email,
    birth_date: row.birth_date,
    created_at: row.created_at,
    insurance_name: first(row.insurance_company)?.name ?? null,
  };
}

export async function listPatients(
  tenantId: string | null,
): Promise<PatientListItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select(LIST_SELECT)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("full_name");

  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row as ListRow));
}

export type PatientSearchResult = {
  items: PatientListItem[];
  total: number;
};

export async function searchPatients(
  tenantId: string | null,
  options: { q?: string; page?: number; pageSize?: number } = {},
): Promise<PatientSearchResult> {
  if (!tenantId) return { items: [], total: 0 };

  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? 10;
  const from = (page - 1) * pageSize;

  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select(LIST_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (options.q) {
    query = query.ilike("full_name", `%${options.q}%`);
  }

  const { data, error, count } = await query
    .order("full_name")
    .range(from, from + pageSize - 1);

  if (error) throw error;

  return {
    items: (data ?? []).map((row) => mapListRow(row as ListRow)),
    total: count ?? 0,
  };
}

export async function getPatient(id: string): Promise<PatientDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, full_name, document, phone, email, birth_date, gender, address, blood_type, insurance_company_id, insurance_card_number, notes, created_at, insurance_company:insurance_companies(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as ListRow & {
    gender: string | null;
    address: string | null;
    blood_type: string | null;
    insurance_company_id: string | null;
    insurance_card_number: string | null;
    notes: string | null;
  };

  return {
    ...mapListRow(row),
    gender: row.gender,
    address: row.address,
    blood_type: row.blood_type,
    insurance_company_id: row.insurance_company_id,
    insurance_card_number: row.insurance_card_number,
    notes: row.notes,
  };
}

export async function listPatientOptions(
  tenantId: string | null,
): Promise<{ id: string; full_name: string }[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}
