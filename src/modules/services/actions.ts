"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { serviceSchema } from "./schema";

export type ServiceActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createService(
  _prev: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
    category: parsed.data.category || null,
    price_cents: parsed.data.price_cents ?? 0,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/services");
  return { ok: true, message: "Serviço cadastrado." };
}

export async function deleteService(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/app/services");
}
