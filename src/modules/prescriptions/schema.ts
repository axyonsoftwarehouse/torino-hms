import { z } from "zod";

export const prescriptionItemSchema = z.object({
  encounter_id: z.string().trim().min(1, "Atendimento inválido"),
  medication: z.string().trim().min(1, "Informe o medicamento"),
  dosage: z.string().trim().default(""),
  frequency: z.string().trim().default(""),
  duration: z.string().trim().default(""),
  instructions: z.string().trim().default(""),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
