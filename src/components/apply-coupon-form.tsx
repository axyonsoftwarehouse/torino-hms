"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyCouponToInvoice, type BillingActionState } from "@/modules/billing/actions";

const INITIAL_STATE: BillingActionState = { ok: false };

export function ApplyCouponForm({ invoiceId }: { invoiceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(applyCouponToInvoice, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Código do cupom</label>
        <Input name="code" placeholder="BEMVINDO10" className="w-52" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Aplicando..." : "Aplicar cupom"}
      </Button>
      {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      {state.ok && state.message ? (
        <span className="text-sm text-emerald-600">{state.message}</span>
      ) : null}
    </form>
  );
}
