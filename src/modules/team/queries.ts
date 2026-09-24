import { createClient } from "@/lib/supabase/server";

export type TeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: string;
};

export async function listTeamMembers(
  tenantId: string | null,
): Promise<TeamMember[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status")
    .eq("tenant_id", tenantId)
    .order("full_name");

  if (error) throw error;
  return (data ?? []) as TeamMember[];
}

export type InviteItem = {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  created_at: string;
};

export async function listInvites(tenantId: string | null): Promise<InviteItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, email, role, token, status, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InviteItem[];
}
