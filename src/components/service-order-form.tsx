"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createServiceOrder, type EquipmentActionState } from "@/modules/equipment/actions";
import { SERVICE_ORDER_TYPES, SERVICE_ORDER_TYPE_LABELS } from "@/modules/equipment/schema";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function ServiceOrderForm({ equipmentId }: { equipmentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createServiceOrder, INITIAL_STATE);

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
        <Label htmlFor="type">Tipo *</Label>
        <select
          id="type"
          name="type"
          defaultValue="corrective"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {SERVICE_ORDER_TYPES.map((type) => (
            <option key={type} value={type}>
              {SERVICE_ORDER_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="scheduled_at">Agendada para</Label>
        <Input id="scheduled_at" name="scheduled_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="technician">Técnico</Label>
        <Input id="technician" name="technician" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost_cents">Custo (R$)</Label>
        <Input id="cost_cents" name="cost_cents" placeholder="0,00" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="description">Descrição do problema / serviço</Label>
        <Input id="description" name="description" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Abrindo..." : "Abrir ordem de serviço"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
