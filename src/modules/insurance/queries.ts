import { createClient } from "@/lib/supabase/server";

export type InsuranceCompanyItem = {
  id: string;
  name: string;
  ans_code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
};

export async function listInsuranceCompanies(
  tenantId: string | null,
): Promise<InsuranceCompanyItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insurance_companies")
    .select("id, name, ans_code, contact_person, phone, email, active")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as InsuranceCompanyItem[];
}
