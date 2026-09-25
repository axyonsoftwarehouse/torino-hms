"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFuel, type FleetActionState } from "@/modules/fleet/actions";

const INITIAL_STATE: FleetActionState = { ok: false };

export function FuelForm({
  vehicleId,
  drivers,
}: {
  vehicleId: string;
  drivers: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createFuel, INITIAL_STATE);

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
        <Label htmlFor="fueled_at">Data</Label>
        <Input id="fueled_at" name="fueled_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="liters">Litros</Label>
        <Input id="liters" name="liters" placeholder="40,5" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit_price_cents">Preço/litro (R$)</Label>
        <Input id="unit_price_cents" name="unit_price_cents" placeholder="5,89" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="odometer_km">Odômetro (km)</Label>
        <Input id="odometer_km" name="odometer_km" type="number" />
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
        <Label htmlFor="station">Posto</Label>
        <Input id="station" name="station" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar abastecimento"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
