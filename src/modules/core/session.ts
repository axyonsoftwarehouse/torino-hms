import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const ACTIVE_TENANT_COOKIE = "torino_active_tenant";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  tenant_id: string | null;
};

export type SessionContext = {
  userId: string;
  email: string | null;
  profile: Profile | null;
  isSuperadmin: boolean;
  activeTenantId: string | null;
};

export async function getSession(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const isSuperadmin = profile?.role === "superadmin";
  const cookieStore = await cookies();
  const cookieTenant = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;

  let activeTenantId = profile?.tenant_id ?? null;

  // Superadmin não pertence a um tenant fixo: usa o tenant selecionado no cookie.
  // Sem cookie => "modo Plataforma" (nenhum tenant ativo).
  if (!activeTenantId && isSuperadmin) {
    activeTenantId = cookieTenant;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
    isSuperadmin,
    activeTenantId,
  };
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
