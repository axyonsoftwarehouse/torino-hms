import { z } from "zod";

import { optionalInt, optionalMoneyCents, optionalNumber, optionalUuid } from "@/lib/validation";

export const FLEET_VEHICLE_TYPES = [
  "ambulance_basic",
  "ambulance_advanced",
  "administrative",
  "van",
  "other",
] as const;
export type FleetVehicleType = (typeof FLEET_VEHICLE_TYPES)[number];
export const FLEET_VEHICLE_TYPE_LABELS: Record<FleetVehicleType, string> = {
  ambulance_basic: "Ambulância básica",
  ambulance_advanced: "Ambulância avançada (UTI)",
  administrative: "Administrativo",
  van: "Van",
  other: "Outro",
};

export const FLEET_VEHICLE_STATUSES = ["available", "in_use", "maintenance", "inactive"] as const;
export type FleetVehicleStatus = (typeof FLEET_VEHICLE_STATUSES)[number];
export const FLEET_VEHICLE_STATUS_LABELS: Record<FleetVehicleStatus, string> = {
  available: "Disponível",
  in_use: "Em uso",
  maintenance: "Em manutenção",
  inactive: "Inativo",
};

export const FLEET_OWNERSHIP_LABELS: Record<string, string> = {
  own: "Próprio",
  rented: "Locado",
};

export const FLEET_TRIP_STATUSES = ["scheduled", "in_progress", "completed", "canceled"] as const;
export type FleetTripStatus = (typeof FLEET_TRIP_STATUSES)[number];
export const FLEET_TRIP_STATUS_LABELS: Record<FleetTripStatus, string> = {
  scheduled: "Agendada",
  in_progress: "Em andamento",
  completed: "Concluída",
  canceled: "Cancelada",
};

export const FLEET_MAINTENANCE_TYPES = ["preventive", "corrective", "inspection"] as const;
export type FleetMaintenanceType = (typeof FLEET_MAINTENANCE_TYPES)[number];
export const FLEET_MAINTENANCE_TYPE_LABELS: Record<FleetMaintenanceType, string> = {
  preventive: "Preventiva",
  corrective: "Corretiva",
  inspection: "Inspeção",
};

export const TRIP_TYPES = [
  "Remoção",
  "Transferência",
  "Atendimento",
  "Administrativo",
  "Entrega",
  "Outro",
] as const;

export const vehicleSchema = z.object({
  plate: z.string().trim().default(""),
  type: z.enum(FLEET_VEHICLE_TYPES),
  brand: z.string().trim().default(""),
  model: z.string().trim().default(""),
  model_year: optionalInt,
  color: z.string().trim().default(""),
  renavam: z.string().trim().default(""),
  chassi: z.string().trim().default(""),
  fuel_type: z.string().trim().default(""),
  ownership: z.enum(["own", "rented"]),
  capacity: optionalInt,
  odometer_km: optionalInt,
  location: z.string().trim().default(""),
  status: z.enum(FLEET_VEHICLE_STATUSES),
  notes: z.string().trim().default(""),
});

export const driverSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome"),
  cnh_number: z.string().trim().default(""),
  cnh_category: z.string().trim().default(""),
  cnh_expires_at: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  email: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const tripSchema = z.object({
  vehicle_id: z.string().trim().min(1, "Selecione o veículo"),
  driver_id: optionalUuid,
  patient_id: optionalUuid,
  trip_type: z.string().trim().default("Remoção"),
  origin: z.string().trim().default(""),
  destination: z.string().trim().default(""),
  scheduled_at: z.string().trim().default(""),
  requester: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const tripCloseSchema = z.object({
  id: z.string().trim().min(1, "Viagem inválida"),
  status: z.enum(FLEET_TRIP_STATUSES),
  odometer_end: optionalInt,
  odometer_start: optionalInt,
  notes: z.string().trim().default(""),
});

export const maintenanceSchema = z.object({
  vehicle_id: z.string().trim().min(1, "Veículo inválido"),
  type: z.enum(FLEET_MAINTENANCE_TYPES),
  description: z.string().trim().default(""),
  service_date: z.string().trim().default(""),
  odometer_km: optionalInt,
  provider: z.string().trim().default(""),
  cost_cents: optionalMoneyCents,
  next_due_date: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const fuelSchema = z.object({
  vehicle_id: z.string().trim().min(1, "Veículo inválido"),
  driver_id: optionalUuid,
  fueled_at: z.string().trim().default(""),
  liters: optionalNumber,
  unit_price_cents: optionalMoneyCents,
  odometer_km: optionalInt,
  station: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const documentSchema = z.object({
  vehicle_id: z.string().trim().min(1, "Veículo inválido"),
  doc_type: z.string().trim().default("crlv"),
  number: z.string().trim().default(""),
  issued_at: z.string().trim().default(""),
  expires_at: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const TRIP_FILTERS = ["scheduled", "in_progress", "completed", "canceled", "all"] as const;
export type TripFilter = (typeof TRIP_FILTERS)[number];
