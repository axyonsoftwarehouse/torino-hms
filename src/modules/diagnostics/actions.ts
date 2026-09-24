"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  EXAM_STATUSES,
  examCategorySchema,
  examOrderItemSchema,
  examOrderSchema,
  examResultSchema,
  examTestSchema,
  type ExamStatus,
} from "./schema";

export type DiagnosticActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function refreshTotal(supabase: Supabase, orderId: string) {
  const { data: items } = await supabase
    .from("exam_order_items")
    .select("subtotal_cents")
    .eq("order_id", orderId);
  const total = (items ?? []).reduce((sum, item) => sum + (item.subtotal_cents ?? 0), 0);
  await supabase.from("exam_orders").update({ total_cents: total }).eq("id", orderId);
}

/* --------------------------- Catálogo de exames --------------------------- */

export async function createExamCategory(
  _prev: DiagnosticActionState,
  formData: FormData,
): Promise<DiagnosticActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = examCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("exam_categories").insert({
    tenant_id: session.activeTenantId,
    kind: parsed.data.kind,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/diagnostics/catalog");
  return { ok: true, message: "Categoria criada." };
}

export async function deleteExamCategory(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("exam_categories").delete().eq("id", id);
  revalidatePath("/app/diagnostics/catalog");
}

export async function createExamTest(
  _prev: DiagnosticActionState,
  formData: FormData,
): Promise<DiagnosticActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = examTestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("exam_tests").insert({
    tenant_id: session.activeTenantId,
    category_id: v.category_id,
    name: v.name,
    description: v.description || null,
    price_cents: v.price_cents ?? 0,
    duration_minutes: v.duration_minutes,
    preparation_instructions: v.preparation_instructions || null,
    reference_value: v.reference_value || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/diagnostics/catalog");
  return { ok: true, message: "Exame cadastrado." };
}

export async function deleteExamTest(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("exam_tests").delete().eq("id", id);
  revalidatePath("/app/diagnostics/catalog");
}

/* ------------------------------ Pedidos/exames ---------------------------- */

export async function createExamOrder(
  _prev: DiagnosticActionState,
  formData: FormData,
): Promise<DiagnosticActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = examOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { count } = await supabase
    .from("exam_orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", session.activeTenantId);
  const orderNumber = `EX-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: order, error } = await supabase
    .from("exam_orders")
    .insert({
      tenant_id: session.activeTenantId,
      order_number: orderNumber,
      patient_id: v.patient_id,
      professional_id: v.professional_id,
      kind: v.kind,
      urgency: v.urgency,
      clinical_notes: v.clinical_notes || null,
      status: "pending",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/diagnostics");
  redirect(`/app/diagnostics/${order!.id}`);
}

export async function addExamOrderItem(
  _prev: DiagnosticActionState,
  formData: FormData,
): Promise<DiagnosticActionState> {
  await requireSession();
  const parsed = examOrderItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const quantity = v.quantity ?? 1;
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("exam_tests")
    .select("name, price_cents")
    .eq("id", v.test_id)
    .maybeSingle();
  if (!test) return { ok: false, error: "Exame não encontrado." };

  const { error } = await supabase.from("exam_order_items").insert({
    order_id: v.order_id,
    test_id: v.test_id,
    test_name: test.name,
    price_cents: test.price_cents ?? 0,
    quantity,
    subtotal_cents: quantity * (test.price_cents ?? 0),
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };

  await refreshTotal(supabase, v.order_id);
  revalidatePath(`/app/diagnostics/${v.order_id}`);
  return { ok: true, message: "Exame adicionado." };
}

export async function deleteExamOrderItem(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const orderId = formData.get("order_id");
  if (typeof id !== "string" || !id || typeof orderId !== "string") return;
  const supabase = await createClient();
  await supabase.from("exam_order_items").delete().eq("id", id);
  await refreshTotal(supabase, orderId);
  revalidatePath(`/app/diagnostics/${orderId}`);
}

export async function saveExamResult(
  _prev: DiagnosticActionState,
  formData: FormData,
): Promise<DiagnosticActionState> {
  await requireSession();
  const parsed = examResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_order_items")
    .update({
      result: v.result || null,
      status: v.result ? "completed" : "pending",
      result_date: v.result ? new Date().toISOString() : null,
    })
    .eq("id", v.item_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/diagnostics/${v.order_id}`);
  return { ok: true, message: "Resultado salvo." };
}

export async function setExamOrderStatus(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const status = formData.get("status");
  if (
    typeof id !== "string" ||
    !id ||
    typeof status !== "string" ||
    !EXAM_STATUSES.includes(status as ExamStatus)
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("exam_orders")
    .update({
      status: status as ExamStatus,
      delivered_at: status === "delivered" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath(`/app/diagnostics/${id}`);
  revalidatePath("/app/diagnostics");
}

export async function deleteExamOrder(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("exam_orders").delete().eq("id", id);
  revalidatePath("/app/diagnostics");
}
