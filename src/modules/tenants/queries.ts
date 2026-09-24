import { createClient } from "@/lib/supabase/server";

export type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

export type TenantAdminItem = {
  id: string;
  name: string;
  slug: string;
  package_key: string;
  status: string;
  patient_limit: number | null;
  professional_limit: number | null;
  created_at: string;
};

export type TenantDetail = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
  country: string | null;
  package_key: string;
  patient_limit: number | null;
  professional_limit: number | null;
  status: string;
  created_at: string;
};

export async function listTenants(): Promise<TenantOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function listTenantsAdmin(): Promise<TenantAdminItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, package_key, status, patient_limit, professional_limit, created_at",
    )
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getTenant(
  id: string,
): Promise<{ tenant: TenantDetail; modules: string[] } | null> {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tenant) return null;

  const { data: modules } = await supabase
    .from("tenant_modules")
    .select("module_key, enabled")
    .eq("tenant_id", id);

  return {
    tenant: tenant as TenantDetail,
    modules: (modules ?? [])
      .filter((m) => m.enabled)
      .map((m) => m.module_key as string),
  };
}
