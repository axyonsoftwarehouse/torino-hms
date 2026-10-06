import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { requiredModuleForPath } from "@/modules/core/access";

describe("requiredModuleForPath", () => {
  it("mapeia rotas para o módulo correspondente", () => {
    expect(requiredModuleForPath("/app/patients")).toBe("patient");
    expect(requiredModuleForPath("/app/patients/123")).toBe("patient");
    expect(requiredModuleForPath("/app/doctors")).toBe("doctor");
    expect(requiredModuleForPath("/app/departments")).toBe("doctor");
    expect(requiredModuleForPath("/app/appointments")).toBe("appointment");
    expect(requiredModuleForPath("/app/diagnostics/catalog")).toBe("lab");
    expect(requiredModuleForPath("/app/pharmacy/suppliers")).toBe("pharmacy");
  });

  it("usa o match mais específico (href mais longo)", () => {
    expect(requiredModuleForPath("/app/equipment/movements")).toBe("equipment");
    expect(requiredModuleForPath("/app/equipment/indicators")).toBe("equipment");
    expect(requiredModuleForPath("/app/fleet/trips")).toBe("ambulance");
  });

  it("retorna null para rotas sem módulo", () => {
    expect(requiredModuleForPath("/app")).toBeNull();
    expect(requiredModuleForPath("/app/tickets")).toBeNull();
    expect(requiredModuleForPath("/app/knowledge")).toBeNull();
    expect(requiredModuleForPath("/app/nao-existe")).toBeNull();
    expect(requiredModuleForPath("/login")).toBeNull();
  });
});
