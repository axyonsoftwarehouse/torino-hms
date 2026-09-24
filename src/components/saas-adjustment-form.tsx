"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSaasAdjustment, type BillingActionState } from "@/modules/billing/actions";
import { ADJUSTMENT_KINDS, ADJUSTMENT_KIND_LABELS } from "@/modules/billing/schema";

const INITIAL_STATE: BillingActionState = { ok: false };

export function SaasAdjustmentForm({ invoiceId }: { invoiceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addSaasAdjustment, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-3"
    >
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <div className="space-y-2">
        <Label htmlFor="kind">Tipo *</Label>
        <select
          id="kind"
          name="kind"
          defaultValue="credit"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {ADJUSTMENT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {ADJUSTMENT_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount_cents">Valor (R$) *</Label>
        <Input id="amount_cents" name="amount_cents" required placeholder="50,00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Motivo</Label>
        <Input id="reason" name="reason" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Aplicando..." : "Aplicar ajuste"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
