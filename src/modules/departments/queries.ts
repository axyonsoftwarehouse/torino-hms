import { createClient } from "@/lib/supabase/server";

export type DepartmentItem = {
  id: string;
  name: string;
  description: string | null;
};

export async function listDepartments(
  tenantId: string | null,
): Promise<DepartmentItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, description")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}
