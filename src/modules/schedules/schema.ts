import { z } from "zod";

import { optionalInt } from "@/lib/validation";

export const scheduleSchema = z
  .object({
    professional_id: z.string().trim().min(1, "Profissional inválido"),
    weekday: z
      .string()
      .trim()
      .min(1, "Selecione o dia")
      .transform((value) => Number(value))
      .refine((value) => Number.isInteger(value) && value >= 0 && value <= 6, "Dia inválido"),
    start_time: z.string().trim().min(1, "Informe o início"),
    end_time: z.string().trim().min(1, "Informe o fim"),
    slot_minutes: optionalInt,
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "O horário final deve ser após o inicial",
    path: ["end_time"],
  });

export type ScheduleInput = z.infer<typeof scheduleSchema>;
