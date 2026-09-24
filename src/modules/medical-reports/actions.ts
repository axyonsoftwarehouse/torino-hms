"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { medicalReportSchema } from "./schema";

export type MedicalReportActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createMedicalReport(
  _prev: MedicalReportActionState,
  formData: FormData,
): Promise<MedicalReportActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = medicalReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { data: report, error } = await supabase
    .from("medical_reports")
    .insert({
      tenant_id: session.activeTenantId,
      report_type: v.report_type,
      patient_id: v.patient_id,
      professional_id: v.professional_id,
      report_date: v.report_date || undefined,
      title: v.title || null,
      description: v.description || null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/medical-reports");
  redirect(`/app/medical-reports/${report!.id}`);
}

export async function updateMedicalReport(
  _prev: MedicalReportActionState,
  formData: FormData,
): Promise<MedicalReportActionState> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Laudo inválido." };
  }

  const parsed = medicalReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("medical_reports")
    .update({
      report_type: v.report_type,
      patient_id: v.patient_id,
      professional_id: v.professional_id,
      report_date: v.report_date || undefined,
      title: v.title || null,
      description: v.description || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/medical-reports");
  revalidatePath(`/app/medical-reports/${id}`);
  return { ok: true, message: "Laudo atualizado." };
}

export async function deleteMedicalReport(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("medical_reports").delete().eq("id", id);
  revalidatePath("/app/medical-reports");
}
