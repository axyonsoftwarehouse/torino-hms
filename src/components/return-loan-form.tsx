"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { returnLoan, type EquipmentActionState } from "@/modules/equipment/actions";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function ReturnLoanForm({
  loanId,
  requiresDisinfection,
}: {
  loanId: string;
  requiresDisinfection: boolean;
}) {
  const [state, formAction, pending] = useActionState(returnLoan, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
      <input type="hidden" name="id" value={loanId} />
      <div className="space-y-2">
        <Label htmlFor={`returned_to-${loanId}`} className="text-xs text-muted-foreground">
          Recolhido por / para
        </Label>
        <Input id={`returned_to-${loanId}`} name="returned_to" placeholder="Engenharia Clínica" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`condition_in-${loanId}`} className="text-xs text-muted-foreground">
          Condição no recolhimento
        </Label>
        <Input id={`condition_in-${loanId}`} name="condition_in" />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="disinfection_done"
            defaultChecked={!requiresDisinfection}
            className="size-4 rounded border"
          />
          Desinfecção realizada
          {requiresDisinfection ? " (obrigatória)" : ""}
        </label>
      </div>
      <div className="space-y-2 sm:col-span-3">
        <Label htmlFor={`notes-${loanId}`} className="text-xs text-muted-foreground">
          Observações
        </Label>
        <Input id={`notes-${loanId}`} name="notes" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Registrar recolhimento"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
