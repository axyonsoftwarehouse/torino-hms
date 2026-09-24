"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stockOut, type PharmacyActionState } from "@/modules/pharmacy/actions";
import {
  MOVEMENT_TYPES,
  MOVEMENT_TYPE_LABELS,
} from "@/modules/pharmacy/schema";

const INITIAL_STATE: PharmacyActionState = { ok: false };

export function StockOutForm({ medicineId }: { medicineId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(stockOut, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-3"
    >
      <input type="hidden" name="medicine_id" value={medicineId} />

      <div className="space-y-2">
        <Label htmlFor="movement_type">Tipo *</Label>
        <select
          id="movement_type"
          name="movement_type"
          defaultValue="out"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {MOVEMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {MOVEMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade *</Label>
        <Input id="quantity" name="quantity" type="number" min={1} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Registrando..." : "Registrar saída"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
