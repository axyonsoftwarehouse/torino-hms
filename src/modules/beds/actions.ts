"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  admissionSchema,
  bedCategorySchema,
  bedSchema,
  dischargeSchema,
  type BedStatus,
} from "./schema";

export type BedActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createBedCategory(
  _prev: BedActionState,
  formData: FormData,
): Promise<BedActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = bedCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bed_categories").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/beds");
  return { ok: true, message: "Categoria criada." };
}

export async function deleteBedCategory(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("bed_categories").delete().eq("id", id);
  revalidatePath("/app/beds");
}

export async function createBed(
  _prev: BedActionState,
  formData: FormData,
): Promise<BedActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = bedSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("beds").insert({
    tenant_id: session.activeTenantId,
    category_id: parsed.data.category_id,
    number: parsed.data.number,
    description: parsed.data.description || null,
    daily_rate_cents: parsed.data.daily_rate_cents ?? 0,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/beds");
  return { ok: true, message: "Leito criado." };
}

export async function setBedStatus(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const status = formData.get("status");
  if (
    typeof id !== "string" ||
    !id ||
    typeof status !== "string" ||
    !["available", "occupied", "maintenance"].includes(status)
  ) {
    return;
  }
  const supabase = await createClient();
  await supabase.from("beds").update({ status: status as BedStatus }).eq("id", id);
  revalidatePath("/app/beds");
}

export async function deleteBed(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("beds").delete().eq("id", id);
  revalidatePath("/app/beds");
}

export async function admitPatient(
  _prev: BedActionState,
  formData: FormData,
): Promise<BedActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = admissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { data: bed } = await supabase
    .from("beds")
    .select("id, status")
    .eq("id", v.bed_id)
    .maybeSingle();
  if (!bed) return { ok: false, error: "Leito não encontrado." };
  if (bed.status !== "available") {
    return { ok: false, error: "Leito não está disponível." };
  }

  const { error } = await supabase.from("bed_assignments").insert({
    tenant_id: session.activeTenantId,
    bed_id: v.bed_id,
    patient_id: v.patient_id,
    professional_id: v.professional_id,
    diagnosis: v.diagnosis || null,
    notes: v.notes || null,
    status: "active",
    created_by: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("beds").update({ status: "occupied" }).eq("id", v.bed_id);

  revalidatePath("/app/beds");
  return { ok: true, message: "Paciente internado." };
}

export async function dischargePatient(
  _prev: BedActionState,
  formData: FormData,
): Promise<BedActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = dischargeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("bed_assignments")
    .select("id, bed_id, status")
    .eq("id", v.assignment_id)
    .maybeSingle();
  if (!assignment) return { ok: false, error: "Internação não encontrada." };
  if (assignment.status !== "active") {
    return { ok: false, error: "Internação já encerrada." };
  }

  const dischargedAt = v.discharged_at
    ? new Date(v.discharged_at).toISOString()
    : new Date().toISOString();

  await supabase.from("bed_discharges").insert({
    tenant_id: session.activeTenantId,
    assignment_id: v.assignment_id,
    discharged_at: dischargedAt,
    final_diagnosis: v.final_diagnosis || null,
    summary: v.summary || null,
    instructions: v.instructions || null,
    created_by: session.userId,
  });

  await supabase
    .from("bed_assignments")
    .update({ status: "discharged", discharged_at: dischargedAt })
    .eq("id", v.assignment_id);

  await supabase
    .from("beds")
    .update({ status: "available" })
    .eq("id", assignment.bed_id);

  revalidatePath("/app/beds");
  redirect("/app/beds");
}
