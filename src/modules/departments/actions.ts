"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { departmentSchema } from "./schema";

export type DepartmentActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createDepartment(
  _prev: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/departments");
  return { ok: true, message: "Departamento criado." };
}

export async function deleteDepartment(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("departments").delete().eq("id", id);
  revalidatePath("/app/departments");
}
