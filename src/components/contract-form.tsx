"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createContract, type EquipmentActionState } from "@/modules/equipment/actions";
import {
  EQUIPMENT_CONTRACT_TYPES,
  EQUIPMENT_CONTRACT_TYPE_LABELS,
} from "@/modules/equipment/schema";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function ContractForm({ equipmentId }: { equipmentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createContract, INITIAL_STATE);

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
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          defaultValue="maintenance"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {EQUIPMENT_CONTRACT_TYPES.map((type) => (
            <option key={type} value={type}>
              {EQUIPMENT_CONTRACT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="provider">Fornecedor / prestador</Label>
        <Input id="provider" name="provider" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="start_date">Início</Label>
        <Input id="start_date" name="start_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="end_date">Fim</Label>
        <Input id="end_date" name="end_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value_cents">Valor (R$)</Label>
        <Input id="value_cents" name="value_cents" placeholder="0,00" />
      </div>
      <div className="space-y-2 sm:col-span-3">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar contrato"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
