import { describe, expect, it } from "vitest";

import { MODULE_KEYS, getPackage, resolveTenantModules } from "@/modules/core/catalog";

describe("catalog", () => {
  it("chaves de módulo são únicas", () => {
    expect(new Set(MODULE_KEYS).size).toBe(MODULE_KEYS.length);
  });

  it("getPackage retorna módulos e limites do pacote", () => {
    const clinica = getPackage("clinica");
    expect(clinica?.modules).toContain("dental");
    expect(clinica?.limits.patients).toBe(2000);

    const hospital = getPackage("hospital");
    expect(hospital?.limits.patients).toBeNull();
    expect(hospital?.modules).toContain("bed");
  });

  it("resolveTenantModules une pacote + addons sem duplicar", () => {
    const modules = resolveTenantModules("basico", ["sms", "patient"]);
    expect(modules).toContain("sms");
    expect(modules).toContain("patient");
    expect(new Set(modules).size).toBe(modules.length);
  });
});
