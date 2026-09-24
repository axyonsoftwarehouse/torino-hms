"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMaintenancePlan, type EquipmentActionState } from "@/modules/equipment/actions";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function MaintenancePlanForm({ equipmentId }: { equipmentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createMaintenancePlan, INITIAL_STATE);

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
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input id="description" name="description" required placeholder="Manutenção preventiva semestral" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="periodicity_days">Periodicidade (dias)</Label>
        <Input id="periodicity_days" name="periodicity_days" type="number" min={1} placeholder="180" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="last_done_at">Última execução</Label>
        <Input id="last_done_at" name="last_done_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next_due_date">Próxima (opcional)</Label>
        <Input id="next_due_date" name="next_due_date" type="date" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar plano"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
