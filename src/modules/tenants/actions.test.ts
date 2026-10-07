import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeQuery } from "@/test-utils/mock-supabase";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  requireSession: vi.fn(),
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mocks.from, rpc: mocks.rpc })),
}));

vi.mock("@/modules/core/session", () => ({
  ACTIVE_TENANT_COOKIE: "torino_active_tenant",
  requireSession: mocks.requireSession,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
    get: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  createTenant,
  enterTenant,
  setActiveTenant,
  updateTenantSettings,
} from "@/modules/tenants/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setActiveTenant", () => {
  it("não define o cookie para não-superadmin", async () => {
    mocks.requireSession.mockResolvedValue({ isSuperadmin: false });
    await setActiveTenant("tenant-1");
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("define o cookie de tenant para superadmin", async () => {
    mocks.requireSession.mockResolvedValue({ isSuperadmin: true });
    await setActiveTenant("tenant-1");
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "torino_active_tenant",
      "tenant-1",
      expect.objectContaining({ httpOnly: true, path: "/" }),
    );
  });
});

describe("enterTenant", () => {
  it("não faz nada quando não é superadmin", async () => {
    mocks.requireSession.mockResolvedValue({ isSuperadmin: false });
    const formData = new FormData();
    formData.set("tenant_id", "tenant-1");
    await enterTenant(formData);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("entra no tenant quando superadmin", async () => {
    mocks.requireSession.mockResolvedValue({ isSuperadmin: true });
    const formData = new FormData();
    formData.set("tenant_id", "tenant-1");
    await enterTenant(formData);
    expect(mocks.cookieSet).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/app");
  });
});

describe("createTenant", () => {
  it("bloqueia não-superadmin", async () => {
    mocks.requireSession.mockResolvedValue({ isSuperadmin: false });
    const result = await createTenant({ ok: false }, new FormData());
    expect(result.ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejeita dados inválidos", async () => {
    mocks.requireSession.mockResolvedValue({ isSuperadmin: true });
    const formData = new FormData();
    formData.set("name", ""); // nome obrigatório
    const result = await createTenant({ ok: false }, formData);
    expect(result.ok).toBe(false);
  });

  it("insere o tenant quando superadmin e dados válidos", async () => {
    mocks.requireSession.mockResolvedValue({ isSuperadmin: true });
    mocks.from.mockReturnValue(makeQuery({ data: { id: "t1" }, error: null }));

    const formData = new FormData();
    formData.set("name", "Clínica Teste");
    formData.set("slug", "clinica-teste");
    formData.set("package_key", "basico");

    await createTenant({ ok: false }, formData);

    expect(mocks.from).toHaveBeenCalledWith("tenants");
    expect(mocks.redirect).toHaveBeenCalledWith("/app/tenants/t1");
  });
});

function settingsForm() {
  const formData = new FormData();
  formData.set("name", "Clínica Teste");
  formData.set("email", "contato@teste.com");
  return formData;
}

describe("updateTenantSettings", () => {
  const tenantAdmin = {
    isSuperadmin: false,
    profile: { role: "tenant_admin" },
    activeTenantId: "t1",
  };
  const professional = {
    isSuperadmin: false,
    profile: { role: "professional" },
    activeTenantId: "t1",
  };

  it("bloqueia papéis sem permissão", async () => {
    mocks.requireSession.mockResolvedValue(professional);
    const result = await updateTenantSettings({ ok: false }, settingsForm());
    expect(result.ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("exige tenant ativo", async () => {
    mocks.requireSession.mockResolvedValue({ ...tenantAdmin, activeTenantId: null });
    const result = await updateTenantSettings({ ok: false }, settingsForm());
    expect(result.ok).toBe(false);
  });

  it("chama a RPC com os dados do tenant", async () => {
    mocks.requireSession.mockResolvedValue(tenantAdmin);
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const result = await updateTenantSettings({ ok: false }, settingsForm());
    expect(result.ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "update_own_tenant",
      expect.objectContaining({ p_tenant_id: "t1", p_name: "Clínica Teste" }),
    );
  });
});
