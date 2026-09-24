"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  equipmentCategorySchema,
  equipmentContractSchema,
  equipmentIncidentSchema,
  equipmentSchema,
  loanSchema,
  maintenancePlanSchema,
  returnLoanSchema,
  serviceOrderCloseSchema,
  serviceOrderSchema,
} from "./schema";

export type EquipmentActionState = { ok: boolean; error?: string; message?: string };

function recalcNextDue(lastDone: string, periodicityDays: number): string | null {
  if (!lastDone) return null;
  const date = new Date(`${lastDone}T00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + periodicityDays);
  return date.toISOString().slice(0, 10);
}

/* -------------------------------- Categorias ------------------------------ */

export async function createEquipmentCategory(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = equipmentCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("equipment_categories").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/equipment/categories");
  return { ok: true, message: "Categoria criada." };
}

export async function deleteEquipmentCategory(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("equipment_categories").delete().eq("id", id);
  revalidatePath("/app/equipment/categories");
}

/* ------------------------------- Equipamentos ----------------------------- */

function equipmentFields(v: {
  category_id: string | null;
  name: string;
  asset_tag: string;
  serial_number: string;
  manufacturer: string;
  model: string;
  anvisa_registration: string;
  location: string;
  responsible: string;
  acquisition_date: string;
  acquisition_value_cents: number | null;
  warranty_until: string;
  criticality: string;
  status: string;
  notes: string;
}) {
  return {
    category_id: v.category_id,
    name: v.name,
    asset_tag: v.asset_tag || null,
    serial_number: v.serial_number || null,
    manufacturer: v.manufacturer || null,
    model: v.model || null,
    anvisa_registration: v.anvisa_registration || null,
    location: v.location || null,
    responsible: v.responsible || null,
    acquisition_date: v.acquisition_date || null,
    acquisition_value_cents: v.acquisition_value_cents ?? 0,
    warranty_until: v.warranty_until || null,
    criticality: v.criticality,
    status: v.status,
    notes: v.notes || null,
  };
}

export async function createEquipment(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = equipmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data: equipment, error } = await supabase
    .from("equipment")
    .insert({
      tenant_id: session.activeTenantId,
      ...equipmentFields(parsed.data),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/equipment");
  redirect(`/app/equipment/${equipment!.id}`);
}

export async function updateEquipment(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, error: "Equipamento inválido." };

  const parsed = equipmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("equipment")
    .update(equipmentFields(parsed.data))
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/equipment");
  revalidatePath(`/app/equipment/${id}`);
  return { ok: true, message: "Equipamento atualizado." };
}

export async function deleteEquipment(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("equipment").delete().eq("id", id);
  revalidatePath("/app/equipment");
}

/* --------------------------- Planos de manutenção ------------------------- */

export async function createMaintenancePlan(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = maintenancePlanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const periodicity = v.periodicity_days ?? 180;
  const nextDue = v.next_due_date || recalcNextDue(v.last_done_at, periodicity);

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_plans").insert({
    tenant_id: session.activeTenantId,
    equipment_id: v.equipment_id,
    description: v.description,
    periodicity_days: periodicity,
    last_done_at: v.last_done_at || null,
    next_due_date: nextDue,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/equipment/${v.equipment_id}`);
  return { ok: true, message: "Plano de manutenção criado." };
}

export async function deleteMaintenancePlan(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const equipmentId = formData.get("equipment_id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("maintenance_plans").delete().eq("id", id);
  if (typeof equipmentId === "string" && equipmentId) {
    revalidatePath(`/app/equipment/${equipmentId}`);
  }
}

/* ----------------------------- Ordens de serviço -------------------------- */

export async function createServiceOrder(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = serviceOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { count } = await supabase
    .from("service_orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", session.activeTenantId);
  const number = `OS-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { error } = await supabase.from("service_orders").insert({
    tenant_id: session.activeTenantId,
    equipment_id: v.equipment_id,
    number,
    type: v.type,
    status: "open",
    scheduled_at: v.scheduled_at || null,
    technician: v.technician || null,
    description: v.description || null,
    cost_cents: v.cost_cents ?? 0,
    created_by: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/equipment/${v.equipment_id}`);
  revalidatePath("/app/equipment");
  return { ok: true, message: "Ordem de serviço aberta." };
}

export async function closeServiceOrder(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  await requireSession();
  const parsed = serviceOrderCloseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const closed = v.status === "done" || v.status === "canceled";
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_orders")
    .update({
      status: v.status,
      technician: v.technician || null,
      findings: v.findings || null,
      cost_cents: v.cost_cents ?? 0,
      certificate_number: v.certificate_number || null,
      certificate_expires_at: v.certificate_expires_at || null,
      closed_at: closed ? new Date().toISOString() : null,
    })
    .eq("id", v.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/equipment");
  return { ok: true, message: "Ordem de serviço atualizada." };
}

export async function deleteServiceOrder(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("service_orders").delete().eq("id", id);
  revalidatePath("/app/equipment");
}

/* ---------------------- Empréstimos / movimentações ----------------------- */

export async function createLoan(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = loanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const isolation = v.isolation === "on";
  const supabase = await createClient();

  const { error } = await supabase.from("equipment_loans").insert({
    tenant_id: session.activeTenantId,
    equipment_id: v.equipment_id,
    sector: v.sector,
    patient_reference: v.patient_reference || null,
    received_by: v.received_by || null,
    condition_out: v.condition_out || null,
    isolation,
    disinfection_required: isolation,
    infection_notes: v.infection_notes || null,
    notes: v.notes || null,
    delivered_by: session.userId,
    created_by: session.userId,
    status: "loaned",
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("equipment").update({ location: v.sector }).eq("id", v.equipment_id);

  revalidatePath("/app/equipment/movements");
  revalidatePath("/app/equipment");
  revalidatePath(`/app/equipment/${v.equipment_id}`);
  return { ok: true, message: "Entrega registrada." };
}

export async function returnLoan(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  await requireSession();
  const parsed = returnLoanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { data: loan } = await supabase
    .from("equipment_loans")
    .select("equipment_id, isolation, disinfection_required")
    .eq("id", v.id)
    .maybeSingle();
  if (!loan) return { ok: false, error: "Empréstimo não encontrado." };

  const disinfectionDone = v.disinfection_done === "on";
  const requireDisinfection = loan.disinfection_required || loan.isolation;

  await supabase
    .from("equipment_loans")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
      returned_to: v.returned_to || null,
      condition_in: v.condition_in || null,
      disinfection_done: disinfectionDone,
      disinfection_at: disinfectionDone ? new Date().toISOString() : null,
      notes: v.notes || null,
    })
    .eq("id", v.id);

  await supabase
    .from("equipment")
    .update({ location: v.returned_to || "Engenharia Clínica" })
    .eq("id", loan.equipment_id);

  revalidatePath("/app/equipment/movements");
  revalidatePath("/app/equipment");
  revalidatePath(`/app/equipment/${loan.equipment_id}`);

  if (requireDisinfection && !disinfectionDone) {
    return {
      ok: true,
      message: "Recolhido. ATENÇÃO: desinfecção obrigatória ainda pendente.",
    };
  }
  return { ok: true, message: "Recolhimento registrado." };
}

export async function deleteLoan(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("equipment_loans").delete().eq("id", id);
  revalidatePath("/app/equipment/movements");
}

/* -------------------------------- Contratos ------------------------------- */

export async function createContract(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = equipmentContractSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("equipment_contracts").insert({
    tenant_id: session.activeTenantId,
    equipment_id: v.equipment_id,
    type: v.type,
    provider: v.provider || null,
    start_date: v.start_date || null,
    end_date: v.end_date || null,
    value_cents: v.value_cents ?? 0,
    notes: v.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/equipment/${v.equipment_id}`);
  return { ok: true, message: "Contrato registrado." };
}

export async function deleteContract(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const equipmentId = formData.get("equipment_id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("equipment_contracts").delete().eq("id", id);
  if (typeof equipmentId === "string" && equipmentId) {
    revalidatePath(`/app/equipment/${equipmentId}`);
  }
}

/* ----------------------------- Tecnovigilância ---------------------------- */

export async function createIncident(
  _prev: EquipmentActionState,
  formData: FormData,
): Promise<EquipmentActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = equipmentIncidentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("equipment_incidents").insert({
    tenant_id: session.activeTenantId,
    equipment_id: v.equipment_id,
    occurred_at: v.occurred_at || undefined,
    description: v.description,
    severity: v.severity,
    anvisa_notified: v.anvisa_notified === "on",
    notification_number: v.notification_number || null,
    created_by: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/equipment/${v.equipment_id}`);
  return { ok: true, message: "Evento de tecnovigilância registrado." };
}

export async function deleteIncident(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const equipmentId = formData.get("equipment_id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("equipment_incidents").delete().eq("id", id);
  if (typeof equipmentId === "string" && equipmentId) {
    revalidatePath(`/app/equipment/${equipmentId}`);
  }
}
