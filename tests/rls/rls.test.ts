import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Testes e2e de RLS/RBAC contra um Supabase de TESTE (local ou dedicado).
 *
 * Pulados por padrão. Para rodar:
 *   npx supabase start
 *   $env:SUPABASE_TEST_URL = "http://127.0.0.1:54321"
 *   $env:SUPABASE_TEST_ANON_KEY = "<anon key do supabase status>"
 *   $env:SUPABASE_TEST_SERVICE_ROLE_KEY = "<service_role do supabase status>"
 *   npm run test:rls
 *
 * O service role é usado apenas no setup/limpeza (bypassa RLS).
 */

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const hasEnv = Boolean(url && anonKey && serviceKey);

const PASSWORD = "Test@123456";

describe.skipIf(!hasEnv)("RLS / RBAC (e2e)", () => {
  const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  let admin: SupabaseClient;
  let tenantA = "";
  let tenantB = "";
  const userIds: string[] = [];

  async function createUser(email: string, tenantId: string, role: string) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("createUser falhou");
    userIds.push(data.user.id);

    const { error: profileError } = await admin
      .from("profiles")
      .update({ tenant_id: tenantId, role, status: "active" })
      .eq("id", data.user.id);
    if (profileError) throw profileError;
    return data.user.id;
  }

  async function signIn(email: string): Promise<SupabaseClient> {
    const client = createClient(url!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) throw error;
    return client;
  }

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const a = await admin
      .from("tenants")
      .insert({ name: "RLS A", slug: `rls-a-${run}`, package_key: "basico" })
      .select("id")
      .single();
    if (a.error) throw a.error;
    tenantA = a.data!.id;

    const b = await admin
      .from("tenants")
      .insert({ name: "RLS B", slug: `rls-b-${run}`, package_key: "basico" })
      .select("id")
      .single();
    if (b.error) throw b.error;
    tenantB = b.data!.id;

    await createUser(`admin-a-${run}@test.local`, tenantA, "tenant_admin");
    await createUser(`patient-a-${run}@test.local`, tenantA, "patient");
    await createUser(`admin-b-${run}@test.local`, tenantB, "tenant_admin");

    const patient = await admin
      .from("patients")
      .insert({ tenant_id: tenantA, full_name: "Paciente RLS" });
    if (patient.error) throw patient.error;
  }, 60_000);

  afterAll(async () => {
    for (const id of userIds) {
      await admin.auth.admin.deleteUser(id).catch(() => undefined);
    }
    if (tenantA) await admin.from("tenants").delete().eq("id", tenantA);
    if (tenantB) await admin.from("tenants").delete().eq("id", tenantB);
  }, 60_000);

  it("isola leitura entre tenants", async () => {
    const userB = await signIn(`admin-b-${run}@test.local`);
    const { data, error } = await userB.from("patients").select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("permite ler dados do próprio tenant", async () => {
    const adminA = await signIn(`admin-a-${run}@test.local`);
    const { data, error } = await adminA.from("patients").select("id");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it("bloqueia leitura do papel patient (RBAC)", async () => {
    const patient = await signIn(`patient-a-${run}@test.local`);
    const { data, error } = await patient.from("patients").select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("permite escrita para tenant_admin", async () => {
    const adminA = await signIn(`admin-a-${run}@test.local`);
    const { error } = await adminA
      .from("patients")
      .insert({ tenant_id: tenantA, full_name: "Escrita permitida" });
    expect(error).toBeNull();
  });

  it("nega escrita para o papel patient (RBAC)", async () => {
    const patient = await signIn(`patient-a-${run}@test.local`);
    const { error } = await patient
      .from("patients")
      .insert({ tenant_id: tenantA, full_name: "Escrita negada" });
    expect(error).not.toBeNull();
  });

  it("registra eventos de auditoria", async () => {
    const adminA = await signIn(`admin-a-${run}@test.local`);
    const { data, error } = await adminA.from("audit_logs").select("id, entity, action");
    expect(error).toBeNull();
    expect((data ?? []).some((row) => row.entity === "patients")).toBe(true);
  });

  it("nega leitura de auditoria para o papel patient", async () => {
    const patient = await signIn(`patient-a-${run}@test.local`);
    const { data, error } = await patient.from("audit_logs").select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});
