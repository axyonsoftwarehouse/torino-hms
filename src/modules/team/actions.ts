"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { inviteSchema, memberActiveSchema, memberRoleSchema } from "./schema";

export type TeamActionState = { ok: boolean; error?: string; message?: string };

async function canManage(): Promise<boolean> {
  const session = await requireSession();
  return session.isSuperadmin || session.profile?.role === "tenant_admin";
}

export async function updateMemberRole(formData: FormData): Promise<void> {
  if (!(await canManage())) return;

  const parsed = memberRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.profile_id);

  revalidatePath("/app/team");
}

export async function setMemberActive(formData: FormData): Promise<void> {
  if (!(await canManage())) return;

  const parsed = memberActiveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ status: parsed.data.active === "true" ? "active" : "inactive" })
    .eq("id", parsed.data.profile_id);

  revalidatePath("/app/team");
}

/* -------------------------------- Convites -------------------------------- */

export async function createInvite(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const session = await requireSession();
  if (!(session.isSuperadmin || session.profile?.role === "tenant_admin")) {
    return { ok: false, error: "Sem permissão para convidar." };
  }
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from("invites").insert({
    tenant_id: session.activeTenantId,
    email: parsed.data.email,
    role: parsed.data.role,
    token,
    status: "pending",
    invited_by: session.userId,
    expires_at: expiresAt,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/team");
  return { ok: true, message: "Convite criado. Copie o link e envie ao usuário." };
}

export async function revokeInvite(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!(session.isSuperadmin || session.profile?.role === "tenant_admin")) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("invites").update({ status: "revoked" }).eq("id", id);
  revalidatePath("/app/team");
}

export async function acceptInviteAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  await requireSession();
  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    return { ok: false, error: "Convite inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Convite inválido, expirado ou já utilizado." };

  revalidatePath("/app");
  redirect("/app");
}
