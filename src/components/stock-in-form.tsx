"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stockIn, type PharmacyActionState } from "@/modules/pharmacy/actions";

const INITIAL_STATE: PharmacyActionState = { ok: false };

export function StockInForm({
  medicineId,
  suppliers,
}: {
  medicineId: string;
  suppliers: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(stockIn, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="medicine_id" value={medicineId} />

      <div className="space-y-2">
        <Label htmlFor="batch_number">Lote *</Label>
        <Input id="batch_number" name="batch_number" required placeholder="L2026-01" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiry_date">Validade</Label>
        <Input id="expiry_date" name="expiry_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade *</Label>
        <Input id="quantity" name="quantity" type="number" min={1} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit_cost_cents">Custo unitário (R$)</Label>
        <Input id="unit_cost_cents" name="unit_cost_cents" placeholder="5,00" />
      </div>
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
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar entrada"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
