import { z } from "zod";

import { optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const professionalSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome"),
  speciality: z.string().trim().default(""),
  license_number: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  email: z.string().trim().default(""),
  department_id: optionalUuid,
  fee_cents: optionalMoneyCents,
  bio: z.string().trim().default(""),
});

export type ProfessionalInput = z.infer<typeof professionalSchema>;
