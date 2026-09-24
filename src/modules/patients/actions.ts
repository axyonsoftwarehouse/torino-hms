"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { patientSchema } from "./schema";

export type PatientActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createPatient(
  _prev: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo. Selecione um tenant." };
  }

  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("patients").insert({
    tenant_id: session.activeTenantId,
    full_name: v.full_name,
    document: v.document || null,
    birth_date: v.birth_date || null,
    gender: v.gender || null,
    phone: v.phone || null,
    email: v.email || null,
    address: v.address || null,
    blood_type: v.blood_type || null,
    insurance_company_id: v.insurance_company_id,
    insurance_card_number: v.insurance_card_number || null,
    notes: v.notes || null,
    created_by: session.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/patients");
  return { ok: true, message: "Paciente cadastrado com sucesso." };
}

export async function deletePatient(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/app/patients");
}
