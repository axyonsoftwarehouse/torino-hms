"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  purchaseItemSchema,
  purchaseOrderSchema,
  purchasePaymentSchema,
} from "./schema";

export type PurchaseActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function refreshTotal(supabase: Supabase, orderId: string) {
  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("total_cents")
    .eq("purchase_order_id", orderId);
  const total = (items ?? []).reduce((sum, item) => sum + (item.total_cents ?? 0), 0);
  await supabase
    .from("purchase_orders")
    .update({ total_cents: total })
    .eq("id", orderId);
}

async function nextNumber(supabase: Supabase, tenantId: string) {
  const { count } = await supabase
    .from("purchase_orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  return `OC-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createPurchaseOrder(
  _prev: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = purchaseOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const number = await nextNumber(supabase, session.activeTenantId);

  const { data: order, error } = await supabase
    .from("purchase_orders")
    .insert({
      tenant_id: session.activeTenantId,
      supplier_id: v.supplier_id,
      number,
      status: "ordered",
      order_date: v.order_date || undefined,
      expected_delivery_date: v.expected_delivery_date || null,
      invoice_number: v.invoice_number || null,
      invoice_date: v.invoice_date || null,
      notes: v.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/purchases");
  redirect(`/app/purchases/${order!.id}`);
}

export async function addPurchaseItem(
  _prev: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  await requireSession();
  const parsed = purchaseItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const quantity = v.quantity ?? 1;
  const unit = v.unit_cost_cents ?? 0;

  const supabase = await createClient();
  const { error } = await supabase.from("purchase_order_items").insert({
    purchase_order_id: v.purchase_order_id,
    medicine_id: v.medicine_id,
    description: v.description,
    quantity,
    unit_cost_cents: unit,
    total_cents: quantity * unit,
    expiry_date: v.expiry_date || null,
    batch_number: v.batch_number || null,
  });

  if (error) return { ok: false, error: error.message };

  await refreshTotal(supabase, v.purchase_order_id);
  revalidatePath(`/app/purchases/${v.purchase_order_id}`);
  return { ok: true, message: "Item adicionado." };
}

export async function deletePurchaseItem(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const orderId = formData.get("purchase_order_id");
  if (typeof id !== "string" || !id || typeof orderId !== "string") return;

  const supabase = await createClient();
  await supabase.from("purchase_order_items").delete().eq("id", id);
  await refreshTotal(supabase, orderId);
  revalidatePath(`/app/purchases/${orderId}`);
}

export async function receivePurchaseOrder(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session.activeTenantId) return;

  const orderId = formData.get("id");
  if (typeof orderId !== "string" || !orderId) return;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("purchase_orders")
    .select("id, number, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status === "received" || order.status === "canceled") return;

  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("id, medicine_id, quantity, unit_cost_cents, expiry_date, batch_number")
    .eq("purchase_order_id", orderId);

  for (const item of items ?? []) {
    if (!item.medicine_id) continue;

    const batchNumber = item.batch_number || `OC-${order.number}`;
    const { data: existing } = await supabase
      .from("medicine_batches")
      .select("id, quantity")
      .eq("tenant_id", session.activeTenantId)
      .eq("medicine_id", item.medicine_id)
      .eq("batch_number", batchNumber)
      .maybeSingle();

    let batchId: string | null = null;
    if (existing) {
      batchId = existing.id;
      await supabase
        .from("medicine_batches")
        .update({
          quantity: (existing.quantity ?? 0) + (item.quantity ?? 0),
          expiry_date: item.expiry_date || null,
          unit_cost_cents: item.unit_cost_cents ?? 0,
        })
        .eq("id", batchId);
    } else {
      const { data: created } = await supabase
        .from("medicine_batches")
        .insert({
          tenant_id: session.activeTenantId,
          medicine_id: item.medicine_id,
          batch_number: batchNumber,
          expiry_date: item.expiry_date || null,
          quantity: item.quantity ?? 0,
          unit_cost_cents: item.unit_cost_cents ?? 0,
        })
        .select("id")
        .single();
      batchId = created?.id ?? null;
    }

    await supabase.from("stock_movements").insert({
      tenant_id: session.activeTenantId,
      medicine_id: item.medicine_id,
      batch_id: batchId,
      movement_type: "in",
      quantity: item.quantity ?? 0,
      unit_cost_cents: item.unit_cost_cents ?? 0,
      reference: `OC ${order.number}`,
      performed_by: session.userId,
    });
  }

  await supabase
    .from("purchase_orders")
    .update({ status: "received", received_at: new Date().toISOString() })
    .eq("id", orderId);

  revalidatePath(`/app/purchases/${orderId}`);
  revalidatePath("/app/purchases");
  revalidatePath("/app/pharmacy");
}

export async function cancelPurchaseOrder(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("purchase_orders").update({ status: "canceled" }).eq("id", id);
  revalidatePath(`/app/purchases/${id}`);
  revalidatePath("/app/purchases");
}

export async function addPurchasePayment(
  _prev: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = purchasePaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const amount = v.amount_cents ?? 0;
  if (amount <= 0) return { ok: false, error: "Informe um valor válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("purchase_payments").insert({
    tenant_id: session.activeTenantId,
    purchase_order_id: v.purchase_order_id,
    amount_cents: amount,
    method: v.method,
    paid_at: v.paid_at || undefined,
    reference: v.reference || null,
    notes: v.notes || null,
    created_by: session.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/purchases/${v.purchase_order_id}`);
  revalidatePath("/app/purchases");
  return { ok: true, message: "Pagamento registrado." };
}

export async function deletePurchasePayment(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const orderId = formData.get("purchase_order_id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("purchase_payments").delete().eq("id", id);
  if (typeof orderId === "string" && orderId) {
    revalidatePath(`/app/purchases/${orderId}`);
  }
}
