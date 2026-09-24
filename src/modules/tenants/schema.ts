import { z } from "zod";

import { PACKAGES, type PackageKey } from "@/modules/core/catalog";

const packageKeys = PACKAGES.map((p) => p.key) as [PackageKey, ...PackageKey[]];

const optionalInt = z
  .string()
  .trim()
  .default("")
  .transform((value) => (value === "" ? null : Number(value)))
  .refine(
    (value) => value === null || (Number.isInteger(value) && (value as number) >= 0),
    "Informe um número válido",
  );

export const tenantSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug")
    .regex(/^[a-z0-9-]+$/, "Use apenas minúsculas, números e hífen"),
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  document: z.string().trim().default(""),
  address: z.string().trim().default(""),
  country: z.string().trim().default("BR"),
  package_key: z.enum(packageKeys),
  patient_limit: optionalInt,
  professional_limit: optionalInt,
});

export type TenantInput = z.infer<typeof tenantSchema>;
