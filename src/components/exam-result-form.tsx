"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  saveExamResult,
  type DiagnosticActionState,
} from "@/modules/diagnostics/actions";

const INITIAL_STATE: DiagnosticActionState = { ok: false };

export function ExamResultForm({
  itemId,
  orderId,
  result,
  referenceValue,
}: {
  itemId: string;
  orderId: string;
  result: string | null;
  referenceValue: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveExamResult, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="order_id" value={orderId} />
      <Label htmlFor={`result-${itemId}`} className="text-xs text-muted-foreground">
        Laudo / resultado
        {referenceValue ? ` · referência: ${referenceValue}` : ""}
      </Label>
      <textarea
        id={`result-${itemId}`}
        name="result"
        defaultValue={result ?? ""}
        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar resultado"}
        </Button>
        {state.error ? <span className="text-xs text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-xs text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
