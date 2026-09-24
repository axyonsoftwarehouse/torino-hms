import { z } from "zod";

import { optionalUuid } from "@/lib/validation";

export const patientSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome completo"),
  document: z.string().trim().optional().default(""),
  birth_date: z.string().trim().optional().default(""),
  gender: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  blood_type: z.string().trim().optional().default(""),
  insurance_company_id: optionalUuid,
  insurance_card_number: z.string().trim().default(""),
  notes: z.string().trim().optional().default(""),
});

export type PatientInput = z.infer<typeof patientSchema>;
