"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getPackage,
  MODULE_KEYS,
  type ModuleKey,
} from "@/modules/core/catalog";
import { ACTIVE_TENANT_COOKIE, requireSession } from "@/modules/core/session";

import { tenantSchema } from "./schema";

export async function setActiveTenant(tenantId: string) {
  const session = await requireSession();
  if (!session.isSuperadmin) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/app");
}

/** Superadmin entra em um tenant (modo Tenant). */
export async function enterTenant(formData: FormData) {
  const session = await requireSession();
  if (!session.isSuperadmin) return;

  const tenantId = formData.get("tenant_id");
  if (typeof tenantId !== "string" || !tenantId) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/app");
  redirect("/app");
}

/** Superadmin sai do tenant e volta ao modo Plataforma. */
export async function exitTenant() {
  const session = await requireSession();
  if (!session.isSuperadmin) return;

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_TENANT_COOKIE);
  revalidatePath("/app");
  redirect("/app");
}

export type TenantActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createTenant(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const session = await requireSession();
  if (!session.isSuperadmin) {
    return { ok: false, error: "Apenas o superadmin pode criar tenants." };
  }

  const parsed = tenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const v = parsed.data;
  const pkg = getPackage(v.package_key);
  const supabase = await createClient();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({
      name: v.name,
      slug: v.slug,
      email: v.email || null,
      phone: v.phone || null,
      document: v.document || null,
      address: v.address || null,
      country: v.country || "BR",
      package_key: v.package_key,
      patient_limit: v.patient_limit ?? pkg?.limits.patients ?? null,
      professional_limit: v.professional_limit ?? pkg?.limits.professionals ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  const modules = pkg?.modules ?? [];
  if (tenant && modules.length > 0) {
    await supabase
      .from("tenant_modules")
      .insert(modules.map((module_key) => ({ tenant_id: tenant.id, module_key })));
  }

  revalidatePath("/app/tenants");
  redirect(`/app/tenants/${tenant!.id}`);
}

export async function updateTenant(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const session = await requireSession();
  if (!session.isSuperadmin) {
    return { ok: false, error: "Apenas o superadmin pode editar tenants." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Tenant inválido." };
  }

  const parsed = tenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: v.name,
      slug: v.slug,
      email: v.email || null,
      phone: v.phone || null,
      document: v.document || null,
      address: v.address || null,
      country: v.country || "BR",
      package_key: v.package_key,
      patient_limit: v.patient_limit,
      professional_limit: v.professional_limit,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/tenants");
  revalidatePath(`/app/tenants/${id}`);
  return { ok: true, message: "Tenant atualizado." };
}

export async function updateTenantModules(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session.isSuperadmin) return;

  const tenantId = formData.get("tenant_id");
  if (typeof tenantId !== "string" || !tenantId) return;

  const selected = formData
    .getAll("modules")
    .map(String)
    .filter((key): key is ModuleKey => MODULE_KEYS.includes(key as ModuleKey));

  const supabase = await createClient();
  await supabase.from("tenant_modules").delete().eq("tenant_id", tenantId);
  if (selected.length > 0) {
    await supabase
      .from("tenant_modules")
      .insert(selected.map((module_key) => ({ tenant_id: tenantId, module_key })));
  }

  revalidatePath(`/app/tenants/${tenantId}`);
}
