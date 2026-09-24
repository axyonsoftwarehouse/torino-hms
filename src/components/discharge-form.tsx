"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dischargePatient, type BedActionState } from "@/modules/beds/actions";

const INITIAL_STATE: BedActionState = { ok: false };

export function DischargeForm({ assignmentId }: { assignmentId: string }) {
  const [state, formAction, pending] = useActionState(dischargePatient, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <div className="space-y-2">
        <Label htmlFor="discharged_at">Data/hora da alta</Label>
        <Input id="discharged_at" name="discharged_at" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="final_diagnosis">Diagnóstico final</Label>
        <Input id="final_diagnosis" name="final_diagnosis" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="summary">Sumário / epicrise</Label>
        <textarea
          id="summary"
          name="summary"
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="instructions">Instruções / prescrição de alta</Label>
        <textarea
          id="instructions"
          name="instructions"
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Processando..." : "Dar alta"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
