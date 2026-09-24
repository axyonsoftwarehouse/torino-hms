import { z } from "zod";

export const optionalInt = z
  .string()
  .trim()
  .default("")
  .transform((value) => (value === "" ? null : Number(value)))
  .refine(
    (value) => value === null || (Number.isInteger(value) && (value as number) >= 0),
    "Informe um número válido",
  );

export const optionalUuid = z
  .string()
  .trim()
  .default("")
  .transform((value) => (value === "" ? null : value));

export const optionalMoneyCents = z
  .string()
  .trim()
  .default("")
  .transform((value) => {
    if (value === "") return null;
    const normalized = value.includes(",")
      ? value.replace(/\./g, "").replace(",", ".")
      : value;
    const number = Number(normalized);
    return Number.isFinite(number) ? Math.round(number * 100) : NaN;
  })
  .refine(
    (value) => value === null || (Number.isInteger(value) && value >= 0),
    "Valor inválido",
  );

export const optionalNumber = z
  .string()
  .trim()
  .default("")
  .transform((value) => {
    if (value === "") return null;
    const number = Number(value.replace(",", "."));
    return Number.isFinite(number) ? number : NaN;
  })
  .refine(
    (value) => value === null || (Number.isFinite(value) && value >= 0),
    "Valor inválido",
  );
