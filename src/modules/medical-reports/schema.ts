import { z } from "zod";

import { optionalUuid } from "@/lib/validation";

export const REPORT_TYPES = ["birth", "operation", "death", "general"] as const;
export type MedicalReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<MedicalReportType, string> = {
  birth: "Nascimento",
  operation: "Cirurgia",
  death: "Óbito",
  general: "Geral",
};

export const REPORT_FILTERS = ["all", ...REPORT_TYPES] as const;
export type ReportFilter = (typeof REPORT_FILTERS)[number];

export const medicalReportSchema = z.object({
  report_type: z.enum(REPORT_TYPES),
  patient_id: z.string().trim().min(1, "Selecione o paciente"),
  professional_id: optionalUuid,
  report_date: z.string().trim().default(""),
  title: z.string().trim().default(""),
  description: z.string().trim().default(""),
});

export type MedicalReportInput = z.infer<typeof medicalReportSchema>;
