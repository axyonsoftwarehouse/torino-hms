"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { professionalSchema } from "./schema";

export type ProfessionalActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createProfessional(
  _prev: ProfessionalActionState,
  formData: FormData,
): Promise<ProfessionalActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = professionalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { data: professional, error } = await supabase
    .from("professionals")
    .insert({
      tenant_id: session.activeTenantId,
      full_name: v.full_name,
      speciality: v.speciality || null,
      license_number: v.license_number || null,
      phone: v.phone || null,
      email: v.email || null,
      department_id: v.department_id,
      fee_cents: v.fee_cents ?? 0,
      bio: v.bio || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/doctors");
  redirect(`/app/doctors/${professional!.id}`);
}

export async function updateProfessional(
  _prev: ProfessionalActionState,
  formData: FormData,
): Promise<ProfessionalActionState> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Profissional inválido." };
  }

  const parsed = professionalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({
      full_name: v.full_name,
      speciality: v.speciality || null,
      license_number: v.license_number || null,
      phone: v.phone || null,
      email: v.email || null,
      department_id: v.department_id,
      fee_cents: v.fee_cents ?? 0,
      bio: v.bio || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/doctors");
  revalidatePath(`/app/doctors/${id}`);
  return { ok: true, message: "Profissional atualizado." };
}

export async function setProfessionalActive(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("professionals").update({ active }).eq("id", id);
  revalidatePath("/app/doctors");
}

export async function deleteProfessional(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("professionals").delete().eq("id", id);
  revalidatePath("/app/doctors");
}
