import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
