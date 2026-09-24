"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { invoiceItemSchema, invoiceSchema, paymentSchema } from "./schema";

export type InvoiceActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function refreshInvoice(supabase: Supabase, invoiceId: string) {
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("invoice_items").select("total_cents").eq("invoice_id", invoiceId),
    supabase.from("payments").select("amount_cents").eq("invoice_id", invoiceId),
  ]);

  const total = (items ?? []).reduce((sum, i) => sum + (i.total_cents ?? 0), 0);
  const paid = (payments ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", invoiceId)
    .maybeSingle();

  const current = invoice?.status ?? "draft";
  let status = current;
  if (current !== "canceled") {
    if (total > 0 && paid >= total) status = "paid";
    else if (paid > 0) status = "issued";
    else if (current === "paid") status = "issued";
  }

  await supabase
    .from("invoices")
    .update({ total_cents: total, status })
    .eq("id", invoiceId);
}

async function nextNumber(supabase: Supabase, tenantId: string) {
  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  return `FAT-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createInvoice(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = invoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const number = await nextNumber(supabase, session.activeTenantId);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      tenant_id: session.activeTenantId,
      patient_id: v.patient_id,
      encounter_id: v.encounter_id,
      number,
      status: "draft",
      total_cents: 0,
      due_date: v.due_date || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/finance");
  redirect(`/app/finance/${invoice!.id}`);
}

export async function addInvoiceItem(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  await requireSession();
  const parsed = invoiceItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const quantity = v.quantity ?? 1;
  const unit = v.unit_price_cents ?? 0;

  const supabase = await createClient();
  const { error } = await supabase.from("invoice_items").insert({
    invoice_id: v.invoice_id,
    service_id: v.service_id,
    description: v.description,
    quantity,
    unit_price_cents: unit,
    total_cents: Math.round(quantity * unit),
  });

  if (error) return { ok: false, error: error.message };

  await refreshInvoice(supabase, v.invoice_id);
  revalidatePath(`/app/finance/${v.invoice_id}`);
  return { ok: true, message: "Item adicionado." };
}

export async function deleteInvoiceItem(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const invoiceId = formData.get("invoice_id");
  if (typeof id !== "string" || !id || typeof invoiceId !== "string") return;

  const supabase = await createClient();
  await supabase.from("invoice_items").delete().eq("id", id);
  await refreshInvoice(supabase, invoiceId);
  revalidatePath(`/app/finance/${invoiceId}`);
}

export async function issueInvoice(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "issued", issued_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath(`/app/finance/${id}`);
  revalidatePath("/app/finance");
}

export async function cancelInvoice(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("invoices").update({ status: "canceled" }).eq("id", id);

  revalidatePath(`/app/finance/${id}`);
  revalidatePath("/app/finance");
}

export async function addPayment(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const amount = v.amount_cents ?? 0;
  if (amount <= 0) {
    return { ok: false, error: "Informe um valor válido." };
  }

  const paidAt = v.paid_at ? new Date(v.paid_at).toISOString() : new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    tenant_id: session.activeTenantId,
    invoice_id: v.invoice_id,
    amount_cents: amount,
    method: v.method,
    paid_at: paidAt,
    notes: v.notes || null,
    created_by: session.userId,
  });

  if (error) return { ok: false, error: error.message };

  await refreshInvoice(supabase, v.invoice_id);
  revalidatePath(`/app/finance/${v.invoice_id}`);
  revalidatePath("/app/finance");
  return { ok: true, message: "Pagamento registrado." };
}

export async function createInvoiceFromEncounter(
  formData: FormData,
): Promise<void> {
  const session = await requireSession();
  if (!session.activeTenantId) return;

  const encounterId = formData.get("encounter_id");
  if (typeof encounterId !== "string" || !encounterId) return;

  const supabase = await createClient();
  const { data: encounter } = await supabase
    .from("encounters")
    .select("id, patient_id, professional_id")
    .eq("id", encounterId)
    .maybeSingle();
  if (!encounter) return;

  let description = "Consulta";
  let unit = 0;
  if (encounter.professional_id) {
    const { data: professional } = await supabase
      .from("professionals")
      .select("full_name, fee_cents")
      .eq("id", encounter.professional_id)
      .maybeSingle();
    if (professional) {
      description = `Consulta — ${professional.full_name}`;
      unit = professional.fee_cents ?? 0;
    }
  }

  const number = await nextNumber(supabase, session.activeTenantId);
  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      tenant_id: session.activeTenantId,
      patient_id: encounter.patient_id,
      encounter_id: encounterId,
      number,
      status: "draft",
      total_cents: unit,
      due_date: null,
    })
    .select("id")
    .single();

  if (!invoice) return;

  await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    description,
    quantity: 1,
    unit_price_cents: unit,
    total_cents: unit,
  });

  revalidatePath("/app/finance");
  redirect(`/app/finance/${invoice.id}`);
}
