"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  APPOINTMENT_STATUSES,
  appointmentSchema,
  type AppointmentStatus,
} from "./schema";

export type AppointmentActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

function toIso(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

async function hasConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  professionalId: string,
  startIso: string,
  endIso: string,
): Promise<boolean> {
  const dayStart = new Date(startIso);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data } = await supabase
    .from("appointments")
    .select("id, scheduled_start, scheduled_end, status")
    .eq("tenant_id", tenantId)
    .eq("professional_id", professionalId)
    .gte("scheduled_start", dayStart.toISOString())
    .lt("scheduled_start", dayEnd.toISOString())
    .not("status", "in", "(canceled,no_show)");

  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  return (data ?? []).some((row) => {
    const rowStart = new Date(row.scheduled_start).getTime();
    const rowEnd = row.scheduled_end
      ? new Date(row.scheduled_end).getTime()
      : rowStart + 30 * 60_000;
    return rowStart < end && rowEnd > start;
  });
}

export async function createAppointment(
  _prev: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const start = toIso(v.scheduled_start);
  if (!start) return { ok: false, error: "Data/hora inválida." };
  const end = v.scheduled_end ? toIso(v.scheduled_end) : null;

  const supabase = await createClient();

  if (v.professional_id) {
    const endIso =
      end ?? new Date(new Date(start).getTime() + 30 * 60_000).toISOString();
    const conflict = await hasConflict(
      supabase,
      session.activeTenantId,
      v.professional_id,
      start,
      endIso,
    );
    if (conflict) {
      return {
        ok: false,
        error: "Conflito de agenda: o profissional já tem consulta nesse horário.",
      };
    }
  }

  const { error } = await supabase.from("appointments").insert({
    tenant_id: session.activeTenantId,
    patient_id: v.patient_id,
    professional_id: v.professional_id,
    scheduled_start: start,
    scheduled_end: end,
    type: v.type || null,
    fee_cents: v.fee_cents ?? 0,
    reason: v.reason || null,
    notes: v.notes || null,
    status: "scheduled",
    created_by: session.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/appointments");
  return { ok: true, message: "Consulta agendada." };
}

export async function setAppointmentStatus(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const status = formData.get("status");
  if (
    typeof id !== "string" ||
    !id ||
    typeof status !== "string" ||
    !APPOINTMENT_STATUSES.includes(status as AppointmentStatus)
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("appointments")
    .update({ status: status as AppointmentStatus })
    .eq("id", id);

  revalidatePath("/app/appointments");
}
