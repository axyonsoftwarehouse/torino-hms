import { createClient } from "@/lib/supabase/server";

export type ServiceItem = {
  id: string;
  name: string;
  category: string | null;
  price_cents: number;
  active: boolean;
};

export async function listServices(tenantId: string | null): Promise<ServiceItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, category, price_cents, active")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as ServiceItem[];
}
