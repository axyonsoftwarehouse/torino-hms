"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPrescriptionItem,
  type PrescriptionActionState,
} from "@/modules/prescriptions/actions";

const INITIAL_STATE: PrescriptionActionState = { ok: false };

export function PrescriptionItemForm({ encounterId }: { encounterId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    addPrescriptionItem,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <input type="hidden" name="encounter_id" value={encounterId} />

      <div className="space-y-2">
        <Label htmlFor="medication">Medicamento *</Label>
        <Input id="medication" name="medication" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dosage">Dose</Label>
        <Input id="dosage" name="dosage" placeholder="500 mg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="frequency">Frequência</Label>
        <Input id="frequency" name="frequency" placeholder="8/8h" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration">Duração</Label>
        <Input id="duration" name="duration" placeholder="7 dias" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">Instruções</Label>
        <Input id="instructions" name="instructions" placeholder="Após as refeições" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar à prescrição"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
