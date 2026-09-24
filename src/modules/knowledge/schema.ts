import { z } from "zod";

import { optionalUuid } from "@/lib/validation";

export const kbCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
});

export const kbArticleSchema = z.object({
  category_id: optionalUuid,
  title: z.string().trim().min(2, "Informe o título"),
  content: z.string().trim().default(""),
  published: z.string().default(""),
});

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
