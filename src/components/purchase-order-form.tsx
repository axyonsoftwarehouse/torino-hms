"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPurchaseOrder,
  type PurchaseActionState,
} from "@/modules/purchases/actions";

const INITIAL_STATE: PurchaseActionState = { ok: false };

export function PurchaseOrderForm({
  suppliers,
}: {
  suppliers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createPurchaseOrder,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="supplier_id">Fornecedor</Label>
        <select
          id="supplier_id"
          name="supplier_id"
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="order_date">Data do pedido</Label>
        <Input id="order_date" name="order_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expected_delivery_date">Entrega prevista</Label>
        <Input id="expected_delivery_date" name="expected_delivery_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoice_number">Nº da NF</Label>
        <Input id="invoice_number" name="invoice_number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoice_date">Data da NF</Label>
        <Input id="invoice_date" name="invoice_date" type="date" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar ordem de compra"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
