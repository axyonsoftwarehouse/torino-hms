"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPurchaseItem,
  type PurchaseActionState,
} from "@/modules/purchases/actions";

const INITIAL_STATE: PurchaseActionState = { ok: false };

export function PurchaseItemForm({
  orderId,
  medicines,
}: {
  orderId: string;
  medicines: { id: string; name: string; purchase_price_cents: number }[];
}) {
  const [description, setDescription] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [state, formAction, pending] = useActionState(addPurchaseItem, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="purchase_order_id" value={orderId} />

      <div className="space-y-2">
        <Label htmlFor="medicine_id">Medicamento</Label>
        <select
          id="medicine_id"
          name="medicine_id"
          defaultValue=""
          onChange={(event) => {
            const medicine = medicines.find((m) => m.id === event.target.value);
            if (medicine) {
              setDescription(medicine.name);
              setUnitCost((medicine.purchase_price_cents / 100).toFixed(2).replace(".", ","));
            }
          }}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">— outro —</option>
          {medicines.map((medicine) => (
            <option key={medicine.id} value={medicine.id}>
              {medicine.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          name="description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Qtd. *</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue="1" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit_cost_cents">Custo unit. (R$)</Label>
        <Input
          id="unit_cost_cents"
          name="unit_cost_cents"
          value={unitCost}
          onChange={(event) => setUnitCost(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiry_date">Validade</Label>
        <Input id="expiry_date" name="expiry_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="batch_number">Lote</Label>
        <Input id="batch_number" name="batch_number" placeholder="(padrão: nº da OC)" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
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
