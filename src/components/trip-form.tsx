"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTrip, type FleetActionState } from "@/modules/fleet/actions";
import { TRIP_TYPES } from "@/modules/fleet/schema";

const INITIAL_STATE: FleetActionState = { ok: false };

export function TripForm({
  vehicles,
  drivers,
  patients,
}: {
  vehicles: { id: string; label: string }[];
  drivers: { id: string; name: string }[];
  patients: { id: string; full_name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createTrip, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="vehicle_id">Veículo *</Label>
        <select
          id="vehicle_id"
          name="vehicle_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="driver_id">Motorista</Label>
        <select id="driver_id" name="driver_id" defaultValue="" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">—</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trip_type">Tipo</Label>
        <select id="trip_type" name="trip_type" defaultValue="Remoção" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          {TRIP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="patient_id">Paciente</Label>
        <select id="patient_id" name="patient_id" defaultValue="" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">—</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="scheduled_at">Agendada para</Label>
        <Input id="scheduled_at" name="scheduled_at" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="origin">Origem</Label>
        <Input id="origin" name="origin" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="destination">Destino</Label>
        <Input id="destination" name="destination" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="requester">Solicitante</Label>
        <Input id="requester" name="requester" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Agendando..." : "Agendar viagem"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
