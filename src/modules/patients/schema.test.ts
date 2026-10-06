import { describe, expect, it } from "vitest";

import { patientSchema } from "@/modules/patients/schema";

describe("patientSchema", () => {
  it("aceita o mínimo e aplica defaults", () => {
    const parsed = patientSchema.parse({ full_name: "Maria Souza" });
    expect(parsed.full_name).toBe("Maria Souza");
    expect(parsed.document).toBe("");
    expect(parsed.notes).toBe("");
    expect(parsed.insurance_company_id).toBeNull();
  });

  it("faz trim do nome e rejeita nome curto", () => {
    expect(patientSchema.parse({ full_name: "  João  " }).full_name).toBe("João");
    expect(patientSchema.safeParse({ full_name: "J" }).success).toBe(false);
    expect(patientSchema.safeParse({ full_name: "" }).success).toBe(false);
  });

  it("normaliza insurance_company_id vazio para null", () => {
    const parsed = patientSchema.parse({
      full_name: "Ana",
      insurance_company_id: "",
    });
    expect(parsed.insurance_company_id).toBeNull();
  });
});
