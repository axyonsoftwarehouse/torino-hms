import { z } from "zod";

import { optionalInt, optionalNumber, optionalUuid } from "@/lib/validation";

export const encounterSchema = z.object({
  patient_id: z.string().trim().min(1, "Selecione o paciente"),
  professional_id: optionalUuid,
  appointment_id: optionalUuid,
  chief_complaint: z.string().trim().default(""),
  diagnosis_code: z.string().trim().default(""),
  diagnosis: z.string().trim().default(""),
  notes: z.string().trim().default(""),
  weight_kg: optionalNumber,
  height_cm: optionalNumber,
  blood_pressure: z.string().trim().default(""),
  temperature_c: optionalNumber,
  heart_rate: optionalInt,
});

export type EncounterInput = z.infer<typeof encounterSchema>;

export const ENCOUNTER_FILTERS = ["open", "closed", "all"] as const;
export type EncounterFilter = (typeof ENCOUNTER_FILTERS)[number];
