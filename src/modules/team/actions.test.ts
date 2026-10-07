import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeQuery } from "@/test-utils/mock-supabase";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  requireSession: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mocks.from, rpc: mocks.rpc })),
}));

vi.mock("@/modules/core/session", () => ({ requireSession: mocks.requireSession }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  createInvite,
  setMemberActive,
  updateMemberRole,
} from "@/modules/team/actions";

function memberForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

const tenantAdmin = { isSuperadmin: false, profile: { role: "tenant_admin" }, activeTenantId: "t1" };
const professional = { isSuperadmin: false, profile: { role: "professional" }, activeTenantId: "t1" };

describe("updateMemberRole", () => {
  it("bloqueia papéis sem permissão", async () => {
    mocks.requireSession.mockResolvedValue(professional);
    await updateMemberRole(memberForm({ profile_id: "p1", role: "nurse" }));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("permite tenant_admin alterar papel", async () => {
    mocks.requireSession.mockResolvedValue(tenantAdmin);
    const query = makeQuery();
    mocks.from.mockReturnValue(query);
    await updateMemberRole(memberForm({ profile_id: "p1", role: "nurse" }));
    expect(query.update).toHaveBeenCalledWith({ role: "nurse" });
    expect(query.eq).toHaveBeenCalledWith("id", "p1");
  });
});

describe("setMemberActive", () => {
  it("permite tenant_admin ativar/desativar", async () => {
    mocks.requireSession.mockResolvedValue(tenantAdmin);
    const query = makeQuery();
    mocks.from.mockReturnValue(query);
    await setMemberActive(memberForm({ profile_id: "p1", active: "false" }));
    expect(query.update).toHaveBeenCalledWith({ status: "inactive" });
  });
});

describe("createInvite", () => {
  it("bloqueia quem não gerencia", async () => {
    mocks.requireSession.mockResolvedValue(professional);
    const result = await createInvite({ ok: false }, memberForm({ email: "a@b.com", role: "nurse" }));
    expect(result.ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("exige tenant ativo", async () => {
    mocks.requireSession.mockResolvedValue({ ...tenantAdmin, activeTenantId: null });
    const result = await createInvite({ ok: false }, memberForm({ email: "a@b.com", role: "nurse" }));
    expect(result.ok).toBe(false);
  });

  it("cria convite para tenant_admin", async () => {
    mocks.requireSession.mockResolvedValue(tenantAdmin);
    const query = makeQuery({ data: null, error: null });
    mocks.from.mockReturnValue(query);
    const result = await createInvite({ ok: false }, memberForm({ email: "a@b.com", role: "nurse" }));
    expect(result.ok).toBe(true);
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "t1", email: "a@b.com", role: "nurse" }),
    );
  });
});
