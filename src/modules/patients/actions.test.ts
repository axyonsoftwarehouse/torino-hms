import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeQuery } from "@/test-utils/mock-supabase";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  requireSession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mocks.from, rpc: mocks.rpc })),
}));

vi.mock("@/modules/core/session", () => ({ requireSession: mocks.requireSession }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createPatient, deletePatient } from "@/modules/patients/actions";

const session = { isSuperadmin: false, userId: "user-1", activeTenantId: "t1" };

function patientForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPatient", () => {
  it("exige tenant ativo", async () => {
    mocks.requireSession.mockResolvedValue({ ...session, activeTenantId: null });
    const result = await createPatient({ ok: false }, patientForm({ full_name: "Maria" }));
    expect(result.ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejeita dados inválidos", async () => {
    mocks.requireSession.mockResolvedValue(session);
    const result = await createPatient({ ok: false }, patientForm({ full_name: "M" }));
    expect(result.ok).toBe(false);
  });

  it("injeta tenant_id e created_by no insert", async () => {
    mocks.requireSession.mockResolvedValue(session);
    const query = makeQuery({ data: null, error: null });
    mocks.from.mockReturnValue(query);

    const result = await createPatient({ ok: false }, patientForm({ full_name: "Maria Souza" }));

    expect(result.ok).toBe(true);
    expect(mocks.from).toHaveBeenCalledWith("patients");
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "t1", created_by: "user-1", full_name: "Maria Souza" }),
    );
  });
});

describe("deletePatient", () => {
  it("exige sessão", async () => {
    mocks.requireSession.mockResolvedValue(session);
    const query = makeQuery();
    mocks.from.mockReturnValue(query);
    await deletePatient(patientForm({ id: "p1" }));
    expect(query.update).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", "p1");
  });
});
