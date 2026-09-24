"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMedicine, type PharmacyActionState } from "@/modules/pharmacy/actions";
import type { MedicineDetail } from "@/modules/pharmacy/queries";

const INITIAL_STATE: PharmacyActionState = { ok: false };

export function MedicineEditForm({
  medicine,
  categories,
}: {
  medicine: MedicineDetail;
  categories: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(updateMedicine, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="id" value={medicine.id} />

      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required defaultValue={medicine.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="generic_name">Nome genérico</Label>
        <Input id="generic_name" name="generic_name" defaultValue={medicine.generic_name ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={medicine.category_id ?? ""}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="manufacturer">Fabricante</Label>
        <Input id="manufacturer" name="manufacturer" defaultValue={medicine.manufacturer ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">Unidade</Label>
        <Input id="unit" name="unit" defaultValue={medicine.unit ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="purchase_price_cents">Custo (R$)</Label>
        <Input
          id="purchase_price_cents"
          name="purchase_price_cents"
          defaultValue={(medicine.purchase_price_cents / 100).toFixed(2).replace(".", ",")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sale_price_cents">Venda (R$)</Label>
        <Input
          id="sale_price_cents"
          name="sale_price_cents"
          defaultValue={(medicine.sale_price_cents / 100).toFixed(2).replace(".", ",")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reorder_level">Estoque mínimo</Label>
        <Input
          id="reorder_level"
          name="reorder_level"
          type="number"
          min={0}
          defaultValue={medicine.reorder_level}
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
