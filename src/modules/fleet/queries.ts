import { createClient } from "@/lib/supabase/server";

import type { TripFilter } from "./schema";

type FullName = { full_name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type VehicleItem = {
  id: string;
  plate: string | null;
  type: string;
  brand: string | null;
  model: string | null;
  status: string;
  location: string | null;
  odometer_km: number;
};

export type DriverItem = {
  id: string;
  full_name: string;
  cnh_number: string | null;
  cnh_category: string | null;
  cnh_expires_at: string | null;
  phone: string | null;
  active: boolean;
};

export type TripItem = {
  id: string;
  vehicle_id: string;
  vehicle_label: string | null;
  driver_name: string | null;
  patient_name: string | null;
  trip_type: string;
  origin: string | null;
  destination: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: string;
};

export type MaintenanceItem = {
  id: string;
  type: string;
  description: string | null;
  service_date: string;
  odometer_km: number | null;
  provider: string | null;
  cost_cents: number;
  next_due_date: string | null;
};

export type FuelItem = {
  id: string;
  fueled_at: string;
  liters: number;
  unit_price_cents: number;
  total_cents: number;
  odometer_km: number | null;
  station: string | null;
};

export type DocumentItem = {
  id: string;
  doc_type: string;
  number: string | null;
  issued_at: string | null;
  expires_at: string | null;
  notes: string | null;
};

export type VehicleDetail = VehicleItem & {
  model_year: number | null;
  color: string | null;
  renavam: string | null;
  chassi: string | null;
  fuel_type: string | null;
  ownership: string;
  capacity: number | null;
  notes: string | null;
  maintenance: MaintenanceItem[];
  fuel: FuelItem[];
  documents: DocumentItem[];
  trips: TripItem[];
};

function vehicleLabel(v: { plate: string | null; brand: string | null; model: string | null }) {
  const name = [v.brand, v.model].filter(Boolean).join(" ");
  return [v.plate, name].filter(Boolean).join(" · ") || "Veículo";
}

export async function listVehicles(tenantId: string | null): Promise<VehicleItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fleet_vehicles")
    .select("id, plate, type, brand, model, status, location, odometer_km")
    .eq("tenant_id", tenantId)
    .order("plate");
  if (error) throw error;
  return (data ?? []) as VehicleItem[];
}

export async function listVehicleOptions(
  tenantId: string | null,
): Promise<{ id: string; label: string }[]> {
  const vehicles = await listVehicles(tenantId);
  return vehicles.map((v) => ({ id: v.id, label: vehicleLabel(v) }));
}

export async function listDrivers(tenantId: string | null): Promise<DriverItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fleet_drivers")
    .select("id, full_name, cnh_number, cnh_category, cnh_expires_at, phone, active")
    .eq("tenant_id", tenantId)
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as DriverItem[];
}

export async function listDriverOptions(
  tenantId: string | null,
): Promise<{ id: string; name: string }[]> {
  const drivers = await listDrivers(tenantId);
  return drivers.filter((d) => d.active).map((d) => ({ id: d.id, name: d.full_name }));
}

const TRIP_SELECT =
  "id, vehicle_id, trip_type, origin, destination, scheduled_at, started_at, ended_at, status, vehicle:fleet_vehicles(plate, brand, model), driver:fleet_drivers(full_name), patient:patients(full_name)";

type TripRow = {
  id: string;
  vehicle_id: string;
  trip_type: string;
  origin: string | null;
  destination: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: string;
  vehicle: { plate: string | null; brand: string | null; model: string | null } | null;
  driver: FullName | FullName[] | null;
  patient: FullName | FullName[] | null;
};

function mapTrip(row: TripRow): TripItem {
  return {
    id: row.id,
    vehicle_id: row.vehicle_id,
    vehicle_label: row.vehicle ? vehicleLabel(row.vehicle) : null,
    driver_name: first(row.driver)?.full_name ?? null,
    patient_name: first(row.patient)?.full_name ?? null,
    trip_type: row.trip_type,
    origin: row.origin,
    destination: row.destination,
    scheduled_at: row.scheduled_at,
    started_at: row.started_at,
    ended_at: row.ended_at,
    status: row.status,
  };
}

export async function listTrips(
  tenantId: string | null,
  filter: TripFilter = "all",
): Promise<TripItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  let query = supabase.from("fleet_trips").select(TRIP_SELECT).eq("tenant_id", tenantId);
  if (filter !== "all") query = query.eq("status", filter);
  const { data, error } = await query.order("scheduled_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapTrip(row as unknown as TripRow));
}

export async function getVehicle(id: string): Promise<VehicleDetail | null> {
  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("fleet_vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!vehicle) return null;

  const [{ data: maintenance }, { data: fuel }, { data: documents }, { data: trips }] =
    await Promise.all([
      supabase
        .from("fleet_maintenance")
        .select("id, type, description, service_date, odometer_km, provider, cost_cents, next_due_date")
        .eq("vehicle_id", id)
        .order("service_date", { ascending: false }),
      supabase
        .from("fleet_fuel")
        .select("id, fueled_at, liters, unit_price_cents, total_cents, odometer_km, station")
        .eq("vehicle_id", id)
        .order("fueled_at", { ascending: false }),
      supabase
        .from("fleet_documents")
        .select("id, doc_type, number, issued_at, expires_at, notes")
        .eq("vehicle_id", id)
        .order("expires_at", { nullsFirst: false }),
      supabase
        .from("fleet_trips")
        .select(TRIP_SELECT)
        .eq("vehicle_id", id)
        .order("scheduled_at", { ascending: false, nullsFirst: false })
        .limit(20),
    ]);

  const row = vehicle as unknown as {
    id: string;
    plate: string | null;
    type: string;
    brand: string | null;
    model: string | null;
    model_year: number | null;
    color: string | null;
    renavam: string | null;
    chassi: string | null;
    fuel_type: string | null;
    ownership: string;
    capacity: number | null;
    odometer_km: number;
    location: string | null;
    status: string;
    notes: string | null;
  };

  return {
    id: row.id,
    plate: row.plate,
    type: row.type,
    brand: row.brand,
    model: row.model,
    model_year: row.model_year,
    color: row.color,
    renavam: row.renavam,
    chassi: row.chassi,
    fuel_type: row.fuel_type,
    ownership: row.ownership,
    capacity: row.capacity,
    odometer_km: row.odometer_km,
    location: row.location,
    status: row.status,
    notes: row.notes,
    maintenance: (maintenance ?? []) as MaintenanceItem[],
    fuel: (fuel ?? []) as FuelItem[],
    documents: (documents ?? []) as DocumentItem[],
    trips: (trips ?? []).map((t) => mapTrip(t as unknown as TripRow)),
  };
}

export type FleetReport = {
  costs: { label: string; fuelCents: number; maintenanceCents: number; totalCents: number }[];
  expiringDocs: { vehicle_label: string; doc_type: string; expires_at: string }[];
  expiringCnh: { name: string; expires_at: string }[];
  tripCounts: { status: string; count: number }[];
};

export async function getFleetReport(
  tenantId: string | null,
  days = 60,
): Promise<FleetReport> {
  if (!tenantId) return { costs: [], expiringDocs: [], expiringCnh: [], tripCounts: [] };

  const supabase = await createClient();
  const vehicles = await listVehicles(tenantId);
  const labelById = new Map<string, string>(
    vehicles.map((v) => [
      v.id,
      [v.plate, [v.brand, v.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ") ||
        "Veículo",
    ]),
  );

  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  const limitStr = limit.toISOString().slice(0, 10);

  const [fuel, maintenance, docs, drivers, trips] = await Promise.all([
    supabase.from("fleet_fuel").select("vehicle_id, total_cents").eq("tenant_id", tenantId),
    supabase.from("fleet_maintenance").select("vehicle_id, cost_cents").eq("tenant_id", tenantId),
    supabase
      .from("fleet_documents")
      .select("vehicle_id, doc_type, expires_at")
      .eq("tenant_id", tenantId)
      .not("expires_at", "is", null)
      .lte("expires_at", limitStr)
      .order("expires_at"),
    supabase
      .from("fleet_drivers")
      .select("full_name, cnh_expires_at")
      .eq("tenant_id", tenantId)
      .not("cnh_expires_at", "is", null)
      .lte("cnh_expires_at", limitStr)
      .order("cnh_expires_at"),
    supabase.from("fleet_trips").select("status").eq("tenant_id", tenantId),
  ]);

  const costMap = new Map<string, { fuelCents: number; maintenanceCents: number }>();
  for (const row of fuel.data ?? []) {
    const cur = costMap.get(row.vehicle_id) ?? { fuelCents: 0, maintenanceCents: 0 };
    cur.fuelCents += row.total_cents ?? 0;
    costMap.set(row.vehicle_id, cur);
  }
  for (const row of maintenance.data ?? []) {
    const cur = costMap.get(row.vehicle_id) ?? { fuelCents: 0, maintenanceCents: 0 };
    cur.maintenanceCents += row.cost_cents ?? 0;
    costMap.set(row.vehicle_id, cur);
  }

  const costs = [...costMap.entries()]
    .map(([vehicleId, value]) => ({
      label: labelById.get(vehicleId) ?? "Veículo",
      fuelCents: value.fuelCents,
      maintenanceCents: value.maintenanceCents,
      totalCents: value.fuelCents + value.maintenanceCents,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const statusMap = new Map<string, number>();
  for (const row of trips.data ?? []) {
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
  }

  return {
    costs,
    expiringDocs: (docs.data ?? []).map((d) => ({
      vehicle_label: labelById.get(d.vehicle_id) ?? "Veículo",
      doc_type: d.doc_type,
      expires_at: d.expires_at as string,
    })),
    expiringCnh: (drivers.data ?? []).map((d) => ({
      name: d.full_name,
      expires_at: d.cnh_expires_at as string,
    })),
    tripCounts: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
  };
}
