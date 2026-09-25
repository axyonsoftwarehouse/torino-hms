"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createVehicle,
  updateVehicle,
  type FleetActionState,
} from "@/modules/fleet/actions";
import type { VehicleDetail } from "@/modules/fleet/queries";
import {
  FLEET_OWNERSHIP_LABELS,
  FLEET_VEHICLE_STATUSES,
  FLEET_VEHICLE_STATUS_LABELS,
  FLEET_VEHICLE_TYPES,
  FLEET_VEHICLE_TYPE_LABELS,
} from "@/modules/fleet/schema";

const INITIAL_STATE: FleetActionState = { ok: false };

export function VehicleForm({ vehicle }: { vehicle?: VehicleDetail }) {
  const editing = Boolean(vehicle);
  const [state, formAction, pending] = useActionState(
    editing ? updateVehicle : createVehicle,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {editing ? <input type="hidden" name="id" value={vehicle!.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="plate">Placa</Label>
        <Input id="plate" name="plate" defaultValue={vehicle?.plate ?? ""} placeholder="ABC-1D23" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo *</Label>
        <select
          id="type"
          name="type"
          defaultValue={vehicle?.type ?? "ambulance_basic"}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {FLEET_VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {FLEET_VEHICLE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand">Marca</Label>
        <Input id="brand" name="brand" defaultValue={vehicle?.brand ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="model">Modelo</Label>
        <Input id="model" name="model" defaultValue={vehicle?.model ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="model_year">Ano</Label>
        <Input id="model_year" name="model_year" type="number" defaultValue={vehicle?.model_year ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Cor</Label>
        <Input id="color" name="color" defaultValue={vehicle?.color ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="renavam">Renavam</Label>
        <Input id="renavam" name="renavam" defaultValue={vehicle?.renavam ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="chassi">Chassi</Label>
        <Input id="chassi" name="chassi" defaultValue={vehicle?.chassi ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fuel_type">Combustível</Label>
        <Input id="fuel_type" name="fuel_type" defaultValue={vehicle?.fuel_type ?? ""} placeholder="Gasolina / Diesel / Flex" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ownership">Propriedade</Label>
        <select
          id="ownership"
          name="ownership"
          defaultValue={vehicle?.ownership ?? "own"}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="own">{FLEET_OWNERSHIP_LABELS.own}</option>
          <option value="rented">{FLEET_OWNERSHIP_LABELS.rented}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacidade</Label>
        <Input id="capacity" name="capacity" type="number" defaultValue={vehicle?.capacity ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="odometer_km">Odômetro (km)</Label>
        <Input id="odometer_km" name="odometer_km" type="number" defaultValue={vehicle?.odometer_km ?? 0} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Base / localização</Label>
        <Input id="location" name="location" defaultValue={vehicle?.location ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={vehicle?.status ?? "available"}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {FLEET_VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {FLEET_VEHICLE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" defaultValue={vehicle?.notes ?? ""} />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar veículo"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
