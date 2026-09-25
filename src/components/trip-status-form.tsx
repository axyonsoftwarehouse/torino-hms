"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTripStatus, type FleetActionState } from "@/modules/fleet/actions";
import { FLEET_TRIP_STATUSES, FLEET_TRIP_STATUS_LABELS } from "@/modules/fleet/schema";

const INITIAL_STATE: FleetActionState = { ok: false };

export function TripStatusForm({
  tripId,
  status,
  odometerStart,
}: {
  tripId: string;
  status: string;
  odometerStart: number | null;
}) {
  const [state, formAction, pending] = useActionState(updateTripStatus, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4">
      <input type="hidden" name="id" value={tripId} />
      <div className="space-y-2">
        <Label htmlFor={`st-${tripId}`} className="text-xs text-muted-foreground">Status</Label>
        <select
          id={`st-${tripId}`}
          name="status"
          defaultValue={status}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {FLEET_TRIP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {FLEET_TRIP_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`os-${tripId}`} className="text-xs text-muted-foreground">Odômetro inicial</Label>
        <Input id={`os-${tripId}`} name="odometer_start" type="number" defaultValue={odometerStart ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`oe-${tripId}`} className="text-xs text-muted-foreground">Odômetro final</Label>
        <Input id={`oe-${tripId}`} name="odometer_end" type="number" />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Atualizar"}
        </Button>
      </div>
      <div className="space-y-2 sm:col-span-4">
        <Label htmlFor={`nt-${tripId}`} className="text-xs text-muted-foreground">Observações</Label>
        <Input id={`nt-${tripId}`} name="notes" />
      </div>
      {state.error ? <span className="text-sm text-destructive sm:col-span-4">{state.error}</span> : null}
      {state.ok && state.message ? (
        <span className="text-sm text-emerald-600 sm:col-span-4">{state.message}</span>
      ) : null}
    </form>
  );
}
