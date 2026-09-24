"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { addSaasPayment, type BillingActionState } from "@/modules/billing/actions";

const INITIAL_STATE: BillingActionState = { ok: false };

export function SaasPaymentForm({ invoiceId }: { invoiceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addSaasPayment, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <div className="space-y-2">
        <Label htmlFor="amount_cents">Valor (R$) *</Label>
        <Input id="amount_cents" name="amount_cents" required placeholder="499,00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="method">Forma</Label>
        <select
          id="method"
          name="method"
          defaultValue="pix"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paid_at">Data</Label>
        <Input id="paid_at" name="paid_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reference">Referência</Label>
        <Input id="reference" name="reference" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar pagamento"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
