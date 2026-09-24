"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  medicineCategorySchema,
  medicineSchema,
  stockInSchema,
  stockOutSchema,
  supplierSchema,
} from "./schema";

export type PharmacyActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

/* ------------------------------- Categorias ------------------------------- */

export async function createMedicineCategory(
  _prev: PharmacyActionState,
  formData: FormData,
): Promise<PharmacyActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = medicineCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("medicine_categories").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/pharmacy");
  return { ok: true, message: "Categoria criada." };
}

export async function deleteMedicineCategory(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("medicine_categories").delete().eq("id", id);
  revalidatePath("/app/pharmacy");
}

/* ------------------------------- Fornecedores ----------------------------- */

export async function createSupplier(
  _prev: PharmacyActionState,
  formData: FormData,
): Promise<PharmacyActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    tenant_id: session.activeTenantId,
    name: v.name,
    company_name: v.company_name || null,
    contact_person: v.contact_person || null,
    email: v.email || null,
    phone: v.phone || null,
    address: v.address || null,
    tax_number: v.tax_number || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/pharmacy/suppliers");
  return { ok: true, message: "Fornecedor criado." };
}

export async function deleteSupplier(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("suppliers").delete().eq("id", id);
  revalidatePath("/app/pharmacy/suppliers");
}

/* ------------------------------- Medicamentos ----------------------------- */

function medicineFields(v: {
  name: string;
  generic_name: string;
  category_id: string | null;
  manufacturer: string;
  unit: string;
  purchase_price_cents: number | null;
  sale_price_cents: number | null;
  reorder_level: number | null;
  notes: string;
}) {
  return {
    name: v.name,
    generic_name: v.generic_name || null,
    category_id: v.category_id,
    manufacturer: v.manufacturer || null,
    unit: v.unit || null,
    purchase_price_cents: v.purchase_price_cents ?? 0,
    sale_price_cents: v.sale_price_cents ?? 0,
    reorder_level: v.reorder_level ?? 0,
    notes: v.notes || null,
  };
}

export async function createMedicine(
  _prev: PharmacyActionState,
  formData: FormData,
): Promise<PharmacyActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = medicineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("medicines").insert({
    tenant_id: session.activeTenantId,
    ...medicineFields(parsed.data),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/pharmacy");
  return { ok: true, message: "Medicamento cadastrado." };
}

export async function updateMedicine(
  _prev: PharmacyActionState,
  formData: FormData,
): Promise<PharmacyActionState> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, error: "Medicamento inválido." };

  const parsed = medicineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("medicines")
    .update(medicineFields(parsed.data))
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/pharmacy");
  revalidatePath(`/app/pharmacy/${id}`);
  return { ok: true, message: "Medicamento atualizado." };
}

export async function deleteMedicine(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("medicines").delete().eq("id", id);
  revalidatePath("/app/pharmacy");
}

/* --------------------------------- Estoque -------------------------------- */

export async function stockIn(
  _prev: PharmacyActionState,
  formData: FormData,
): Promise<PharmacyActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = stockInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const quantity = v.quantity ?? 0;
  if (quantity <= 0) return { ok: false, error: "Informe uma quantidade válida." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("medicine_batches")
    .select("id, quantity")
    .eq("tenant_id", session.activeTenantId)
    .eq("medicine_id", v.medicine_id)
    .eq("batch_number", v.batch_number)
    .maybeSingle();

  let batchId: string;
  if (existing) {
    batchId = existing.id;
    await supabase
      .from("medicine_batches")
      .update({
        quantity: (existing.quantity ?? 0) + quantity,
        expiry_date: v.expiry_date || null,
        unit_cost_cents: v.unit_cost_cents ?? 0,
        supplier_id: v.supplier_id,
      })
      .eq("id", batchId);
  } else {
    const { data: created, error } = await supabase
      .from("medicine_batches")
      .insert({
        tenant_id: session.activeTenantId,
        medicine_id: v.medicine_id,
        supplier_id: v.supplier_id,
        batch_number: v.batch_number,
        expiry_date: v.expiry_date || null,
        quantity,
        unit_cost_cents: v.unit_cost_cents ?? 0,
      })
      .select("id")
      .single();
    if (error || !created) {
      return { ok: false, error: error?.message ?? "Falha ao criar lote." };
    }
    batchId = created.id;
  }

  await supabase.from("stock_movements").insert({
    tenant_id: session.activeTenantId,
    medicine_id: v.medicine_id,
    batch_id: batchId,
    movement_type: "in",
    quantity,
    unit_cost_cents: v.unit_cost_cents ?? 0,
    reference: `Lote ${v.batch_number}`,
    notes: v.notes || null,
    performed_by: session.userId,
  });

  revalidatePath(`/app/pharmacy/${v.medicine_id}`);
  revalidatePath("/app/pharmacy");
  return { ok: true, message: "Entrada registrada." };
}

export async function stockOut(
  _prev: PharmacyActionState,
  formData: FormData,
): Promise<PharmacyActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = stockOutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const quantity = v.quantity ?? 0;
  if (quantity <= 0) return { ok: false, error: "Informe uma quantidade válida." };

  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("medicine_batches")
    .select("id, quantity, expiry_date")
    .eq("tenant_id", session.activeTenantId)
    .eq("medicine_id", v.medicine_id)
    .gt("quantity", 0)
    .order("expiry_date", { ascending: true, nullsFirst: false });

  const available = (batches ?? []).reduce((sum, b) => sum + (b.quantity ?? 0), 0);
  if (available < quantity) {
    return { ok: false, error: `Estoque insuficiente (disponível: ${available}).` };
  }

  let remaining = quantity;
  for (const batch of batches ?? []) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity ?? 0, remaining);
    if (take > 0) {
      await supabase
        .from("medicine_batches")
        .update({ quantity: (batch.quantity ?? 0) - take })
        .eq("id", batch.id);
      remaining -= take;
    }
  }

  await supabase.from("stock_movements").insert({
    tenant_id: session.activeTenantId,
    medicine_id: v.medicine_id,
    movement_type: v.movement_type,
    quantity,
    notes: v.notes || null,
    performed_by: session.userId,
  });

  revalidatePath(`/app/pharmacy/${v.medicine_id}`);
  revalidatePath("/app/pharmacy");
  return { ok: true, message: "Saída registrada." };
}
