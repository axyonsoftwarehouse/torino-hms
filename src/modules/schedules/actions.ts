"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { scheduleSchema } from "./schema";

export type ScheduleActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createSchedule(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("professional_schedules").insert({
    tenant_id: session.activeTenantId,
    professional_id: v.professional_id,
    weekday: v.weekday,
    start_time: v.start_time,
    end_time: v.end_time,
    slot_minutes: v.slot_minutes ?? 30,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/doctors/${v.professional_id}`);
  return { ok: true, message: "Disponibilidade adicionada." };
}

export async function deleteSchedule(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const professionalId = formData.get("professional_id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("professional_schedules").delete().eq("id", id);

  if (typeof professionalId === "string" && professionalId) {
    revalidatePath(`/app/doctors/${professionalId}`);
  }
}
