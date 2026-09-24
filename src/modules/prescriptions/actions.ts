"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { prescriptionItemSchema } from "./schema";

export type PrescriptionActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function addPrescriptionItem(
  _prev: PrescriptionActionState,
  formData: FormData,
): Promise<PrescriptionActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = prescriptionItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { data: encounter } = await supabase
    .from("encounters")
    .select("id, tenant_id, patient_id, professional_id")
    .eq("id", v.encounter_id)
    .maybeSingle();

  if (!encounter) return { ok: false, error: "Atendimento não encontrado." };

  let prescriptionId: string | null = null;
  const { data: existing } = await supabase
    .from("prescriptions")
    .select("id")
    .eq("encounter_id", v.encounter_id)
    .maybeSingle();

  if (existing) {
    prescriptionId = existing.id;
  } else {
    const { data: created, error: createError } = await supabase
      .from("prescriptions")
      .insert({
        tenant_id: encounter.tenant_id,
        encounter_id: v.encounter_id,
        patient_id: encounter.patient_id,
        professional_id: encounter.professional_id,
      })
      .select("id")
      .single();
    if (createError || !created) {
      return { ok: false, error: createError?.message ?? "Falha ao criar prescrição." };
    }
    prescriptionId = created.id;
  }

  const { error } = await supabase.from("prescription_items").insert({
    prescription_id: prescriptionId,
    medication: v.medication,
    dosage: v.dosage || null,
    frequency: v.frequency || null,
    duration: v.duration || null,
    instructions: v.instructions || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/encounters/${v.encounter_id}`);
  return { ok: true, message: "Item adicionado à prescrição." };
}

export async function deletePrescriptionItem(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const encounterId = formData.get("encounter_id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("prescription_items").delete().eq("id", id);

  if (typeof encounterId === "string" && encounterId) {
    revalidatePath(`/app/encounters/${encounterId}`);
  }
}
