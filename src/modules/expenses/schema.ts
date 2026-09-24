import { z } from "zod";

import { optionalMoneyCents, optionalUuid } from "@/lib/validation";

export const expenseSchema = z.object({
  category_id: optionalUuid,
  description: z.string().trim().min(2, "Informe a descrição"),
  amount_cents: optionalMoneyCents,
  spent_at: z.string().trim().default(""),
  method: z.string().trim().default(""),
});

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
