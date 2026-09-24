"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSaasInvoice, type BillingActionState } from "@/modules/billing/actions";

const INITIAL_STATE: BillingActionState = { ok: false };

export function SaasInvoiceForm({
  tenants,
}: {
  tenants: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSaasInvoice, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="tenant_id">Tenant *</Label>
        <select
          id="tenant_id"
          name="tenant_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="due_date">Vencimento</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="period_start">Período (início)</Label>
        <Input id="period_start" name="period_start" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="period_end">Período (fim)</Label>
        <Input id="period_end" name="period_end" type="date" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar fatura (com valor do plano)"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
