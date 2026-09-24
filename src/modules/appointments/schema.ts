import { z } from "zod";

import { optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const appointmentSchema = z.object({
  patient_id: z.string().trim().min(1, "Selecione o paciente"),
  professional_id: optionalUuid,
  scheduled_start: z.string().trim().min(1, "Informe a data e hora"),
  scheduled_end: z.string().trim().default(""),
  type: z.string().trim().default(""),
  fee_cents: optionalMoneyCents,
  reason: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
  "canceled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Concluída",
  canceled: "Cancelada",
  no_show: "Não compareceu",
};
