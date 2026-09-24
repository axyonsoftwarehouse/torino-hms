"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSaasInvoiceItem, type BillingActionState } from "@/modules/billing/actions";

const INITIAL_STATE: BillingActionState = { ok: false };

export function SaasInvoiceItemForm({ invoiceId }: { invoiceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addSaasInvoiceItem, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-4"
    >
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input id="description" name="description" required placeholder="Add-on / excedente" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Qtd.</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue="1" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit_price_cents">Valor unit. (R$)</Label>
        <Input id="unit_price_cents" name="unit_price_cents" placeholder="99,00" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar item"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
