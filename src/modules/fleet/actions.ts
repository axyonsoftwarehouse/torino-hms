"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  documentSchema,
  driverSchema,
  fuelSchema,
  maintenanceSchema,
  tripCloseSchema,
  tripSchema,
  vehicleSchema,
} from "./schema";

export type FleetActionState = { ok: boolean; error?: string; message?: string };

/* -------------------------------- Veículos -------------------------------- */

function vehicleFields(v: {
  plate: string;
  type: string;
  brand: string;
  model: string;
  model_year: number | null;
  color: string;
  renavam: string;
  chassi: string;
  fuel_type: string;
  ownership: string;
  capacity: number | null;
  odometer_km: number | null;
  location: string;
  status: string;
  notes: string;
}) {
  return {
    plate: v.plate || null,
    type: v.type,
    brand: v.brand || null,
    model: v.model || null,
    model_year: v.model_year,
    color: v.color || null,
    renavam: v.renavam || null,
    chassi: v.chassi || null,
    fuel_type: v.fuel_type || null,
    ownership: v.ownership,
    capacity: v.capacity,
    odometer_km: v.odometer_km ?? 0,
    location: v.location || null,
    status: v.status,
    notes: v.notes || null,
  };
}

export async function createVehicle(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data: vehicle, error } = await supabase
    .from("fleet_vehicles")
    .insert({ tenant_id: session.activeTenantId, ...vehicleFields(parsed.data) })
    .select("id")
    .single();
  if (error) {
    return { ok: false, error: error.code === "23505" ? "Placa já cadastrada." : error.message };
  }

  revalidatePath("/app/fleet");
  redirect(`/app/fleet/${vehicle!.id}`);
}

export async function updateVehicle(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, error: "Veículo inválido." };

  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fleet_vehicles")
    .update(vehicleFields(parsed.data))
    .eq("id", id);
  if (error) {
    return { ok: false, error: error.code === "23505" ? "Placa já cadastrada." : error.message };
  }

  revalidatePath("/app/fleet");
  revalidatePath(`/app/fleet/${id}`);
  return { ok: true, message: "Veículo atualizado." };
}

export async function deleteVehicle(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("fleet_vehicles").delete().eq("id", id);
  revalidatePath("/app/fleet");
}

/* -------------------------------- Motoristas ------------------------------ */

export async function createDriver(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = driverSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("fleet_drivers").insert({
    tenant_id: session.activeTenantId,
    full_name: v.full_name,
    cnh_number: v.cnh_number || null,
    cnh_category: v.cnh_category || null,
    cnh_expires_at: v.cnh_expires_at || null,
    phone: v.phone || null,
    email: v.email || null,
    notes: v.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/fleet/drivers");
  return { ok: true, message: "Motorista cadastrado." };
}

export async function setDriverActive(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("fleet_drivers").update({ active }).eq("id", id);
  revalidatePath("/app/fleet/drivers");
}

export async function deleteDriver(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("fleet_drivers").delete().eq("id", id);
  revalidatePath("/app/fleet/drivers");
}

/* ---------------------------------- Viagens ------------------------------- */

export async function createTrip(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = tripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("fleet_trips").insert({
    tenant_id: session.activeTenantId,
    vehicle_id: v.vehicle_id,
    driver_id: v.driver_id,
    patient_id: v.patient_id,
    trip_type: v.trip_type,
    origin: v.origin || null,
    destination: v.destination || null,
    scheduled_at: v.scheduled_at ? new Date(v.scheduled_at).toISOString() : null,
    requester: v.requester || null,
    notes: v.notes || null,
    status: "scheduled",
    created_by: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/fleet/trips");
  return { ok: true, message: "Viagem agendada." };
}

export async function updateTripStatus(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  await requireSession();
  const parsed = tripCloseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("fleet_trips")
    .select("vehicle_id, odometer_start")
    .eq("id", v.id)
    .maybeSingle();
  if (!trip) return { ok: false, error: "Viagem não encontrada." };

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status: v.status, notes: v.notes || null };
  if (v.status === "in_progress") {
    update.started_at = now;
    update.odometer_start = v.odometer_start ?? trip.odometer_start ?? null;
  } else if (v.status === "completed") {
    update.ended_at = now;
    update.odometer_start = v.odometer_start ?? trip.odometer_start ?? null;
    update.odometer_end = v.odometer_end ?? null;
  }

  await supabase.from("fleet_trips").update(update).eq("id", v.id);

  // Sincroniza status/odômetro do veículo
  if (v.status === "in_progress") {
    await supabase.from("fleet_vehicles").update({ status: "in_use" }).eq("id", trip.vehicle_id);
  } else if (v.status === "completed" || v.status === "canceled") {
    await supabase.from("fleet_vehicles").update({ status: "available" }).eq("id", trip.vehicle_id);
    if (v.status === "completed" && v.odometer_end) {
      await supabase
        .from("fleet_vehicles")
        .update({ odometer_km: v.odometer_end })
        .eq("id", trip.vehicle_id);
    }
  }

  revalidatePath("/app/fleet/trips");
  revalidatePath(`/app/fleet/${trip.vehicle_id}`);
  return { ok: true, message: "Viagem atualizada." };
}

export async function deleteTrip(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("fleet_trips").delete().eq("id", id);
  revalidatePath("/app/fleet/trips");
}

/* -------------------------------- Manutenção ------------------------------ */

export async function createMaintenance(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = maintenanceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("fleet_maintenance").insert({
    tenant_id: session.activeTenantId,
    vehicle_id: v.vehicle_id,
    type: v.type,
    description: v.description || null,
    service_date: v.service_date || undefined,
    odometer_km: v.odometer_km,
    provider: v.provider || null,
    cost_cents: v.cost_cents ?? 0,
    next_due_date: v.next_due_date || null,
    notes: v.notes || null,
    created_by: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/fleet/${v.vehicle_id}`);
  return { ok: true, message: "Manutenção registrada." };
}

export async function deleteMaintenance(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const vehicleId = formData.get("vehicle_id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("fleet_maintenance").delete().eq("id", id);
  if (typeof vehicleId === "string" && vehicleId) revalidatePath(`/app/fleet/${vehicleId}`);
}

/* ------------------------------- Combustível ------------------------------ */

export async function createFuel(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = fuelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const liters = v.liters ?? 0;
  const unit = v.unit_price_cents ?? 0;
  const supabase = await createClient();
  const { error } = await supabase.from("fleet_fuel").insert({
    tenant_id: session.activeTenantId,
    vehicle_id: v.vehicle_id,
    driver_id: v.driver_id,
    fueled_at: v.fueled_at || undefined,
    liters,
    unit_price_cents: unit,
    total_cents: Math.round(liters * unit),
    odometer_km: v.odometer_km,
    station: v.station || null,
    notes: v.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/fleet/${v.vehicle_id}`);
  return { ok: true, message: "Abastecimento registrado." };
}

export async function deleteFuel(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const vehicleId = formData.get("vehicle_id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("fleet_fuel").delete().eq("id", id);
  if (typeof vehicleId === "string" && vehicleId) revalidatePath(`/app/fleet/${vehicleId}`);
}

/* -------------------------------- Documentos ------------------------------ */

export async function createDocument(
  _prev: FleetActionState,
  formData: FormData,
): Promise<FleetActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("fleet_documents").insert({
    tenant_id: session.activeTenantId,
    vehicle_id: v.vehicle_id,
    doc_type: v.doc_type,
    number: v.number || null,
    issued_at: v.issued_at || null,
    expires_at: v.expires_at || null,
    notes: v.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/fleet/${v.vehicle_id}`);
  return { ok: true, message: "Documento registrado." };
}

export async function deleteDocument(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  const vehicleId = formData.get("vehicle_id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("fleet_documents").delete().eq("id", id);
  if (typeof vehicleId === "string" && vehicleId) revalidatePath(`/app/fleet/${vehicleId}`);
}
