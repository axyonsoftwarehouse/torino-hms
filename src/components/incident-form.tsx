"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIncident, type EquipmentActionState } from "@/modules/equipment/actions";
import { INCIDENT_SEVERITIES, INCIDENT_SEVERITY_LABELS } from "@/modules/equipment/schema";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function IncidentForm({ equipmentId }: { equipmentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createIncident, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="equipment_id" value={equipmentId} />
      <div className="space-y-2">
        <Label htmlFor="occurred_at">Data do evento</Label>
        <Input id="occurred_at" name="occurred_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="severity">Gravidade</Label>
        <select
          id="severity"
          name="severity"
          defaultValue="medium"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {INCIDENT_SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {INCIDENT_SEVERITY_LABELS[severity]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notification_number">Nº notificação (NOTIVISA)</Label>
        <Input id="notification_number" name="notification_number" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="description">Descrição do evento / queixa técnica *</Label>
        <Input id="description" name="description" required />
      </div>
      <div className="flex items-end gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="anvisa_notified" className="size-4 rounded border" />
          Notificado à ANVISA
        </label>
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar evento"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
