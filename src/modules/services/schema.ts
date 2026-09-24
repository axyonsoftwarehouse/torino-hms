import { z } from "zod";

import { optionalMoneyCents } from "@/lib/validation";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  category: z.string().trim().default(""),
  price_cents: optionalMoneyCents,
});

export type ServiceInput = z.infer<typeof serviceSchema>;
