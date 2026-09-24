"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { insuranceCompanySchema } from "./schema";

export type InsuranceActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createInsuranceCompany(
  _prev: InsuranceActionState,
  formData: FormData,
): Promise<InsuranceActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = insuranceCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("insurance_companies").insert({
    tenant_id: session.activeTenantId,
    name: v.name,
    ans_code: v.ans_code || null,
    contact_person: v.contact_person || null,
    phone: v.phone || null,
    email: v.email || null,
    notes: v.notes || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/insurance");
  return { ok: true, message: "Convênio cadastrado." };
}

export async function deleteInsuranceCompany(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("insurance_companies").delete().eq("id", id);
  revalidatePath("/app/insurance");
}
