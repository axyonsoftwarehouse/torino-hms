"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { encounterSchema } from "./schema";

export type EncounterActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

function vitalFields(v: {
  weight_kg: number | null;
  height_cm: number | null;
  blood_pressure: string;
  temperature_c: number | null;
  heart_rate: number | null;
}) {
  return {
    weight_kg: v.weight_kg,
    height_cm: v.height_cm,
    blood_pressure: v.blood_pressure || null,
    temperature_c: v.temperature_c,
    heart_rate: v.heart_rate,
  };
}

export async function createEncounter(
  _prev: EncounterActionState,
  formData: FormData,
): Promise<EncounterActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = encounterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { data: encounter, error } = await supabase
    .from("encounters")
    .insert({
      tenant_id: session.activeTenantId,
      patient_id: v.patient_id,
      professional_id: v.professional_id,
      appointment_id: v.appointment_id,
      chief_complaint: v.chief_complaint || null,
      status: "open",
      ...vitalFields(v),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/encounters");
  redirect(`/app/encounters/${encounter!.id}`);
}

export async function updateEncounter(
  _prev: EncounterActionState,
  formData: FormData,
): Promise<EncounterActionState> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Atendimento inválido." };
  }

  const parsed = encounterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("encounters")
    .update({
      chief_complaint: v.chief_complaint || null,
      diagnosis_code: v.diagnosis_code || null,
      diagnosis: v.diagnosis || null,
      notes: v.notes || null,
      ...vitalFields(v),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/encounters");
  revalidatePath(`/app/encounters/${id}`);
  return { ok: true, message: "Atendimento atualizado." };
}

export async function closeEncounter(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase
    .from("encounters")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/app/encounters");
  revalidatePath(`/app/encounters/${id}`);
}

export async function reopenEncounter(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase
    .from("encounters")
    .update({ status: "open", closed_at: null })
    .eq("id", id);

  revalidatePath("/app/encounters");
  revalidatePath(`/app/encounters/${id}`);
}

export async function deleteEncounter(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("encounters").delete().eq("id", id);
  revalidatePath("/app/encounters");
}

export async function startEncounterFromAppointment(
  formData: FormData,
): Promise<void> {
  const session = await requireSession();
  if (!session.activeTenantId) return;

  const appointmentId = formData.get("appointment_id");
  if (typeof appointmentId !== "string" || !appointmentId) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("encounters")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("status", "open")
    .maybeSingle();
  if (existing) redirect(`/app/encounters/${existing.id}`);

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, patient_id, professional_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appointment) return;

  const { data: encounter } = await supabase
    .from("encounters")
    .insert({
      tenant_id: session.activeTenantId,
      patient_id: appointment.patient_id,
      professional_id: appointment.professional_id,
      appointment_id: appointmentId,
      status: "open",
    })
    .select("id")
    .single();

  if (encounter) redirect(`/app/encounters/${encounter.id}`);
}
