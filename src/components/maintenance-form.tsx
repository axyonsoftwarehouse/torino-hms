"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMaintenance, type FleetActionState } from "@/modules/fleet/actions";
import { FLEET_MAINTENANCE_TYPES, FLEET_MAINTENANCE_TYPE_LABELS } from "@/modules/fleet/schema";

const INITIAL_STATE: FleetActionState = { ok: false };

export function MaintenanceForm({ vehicleId }: { vehicleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createMaintenance, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select id="type" name="type" defaultValue="preventive" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          {FLEET_MAINTENANCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {FLEET_MAINTENANCE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="service_date">Data</Label>
        <Input id="service_date" name="service_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="odometer_km">Odômetro (km)</Label>
        <Input id="odometer_km" name="odometer_km" type="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost_cents">Custo (R$)</Label>
        <Input id="cost_cents" name="cost_cents" placeholder="0,00" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="provider">Oficina / prestador</Label>
        <Input id="provider" name="provider" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next_due_date">Próxima</Label>
        <Input id="next_due_date" name="next_due_date" type="date" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar manutenção"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
