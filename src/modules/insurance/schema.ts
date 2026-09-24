import { z } from "zod";

export const insuranceCompanySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  ans_code: z.string().trim().default(""),
  contact_person: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  email: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export type InsuranceCompanyInput = z.infer<typeof insuranceCompanySchema>;
