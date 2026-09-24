"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBed, type BedActionState } from "@/modules/beds/actions";

const INITIAL_STATE: BedActionState = { ok: false };

export function BedForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createBed, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria *</Label>
        <select
          id="category_id"
          name="category_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">Número *</Label>
        <Input id="number" name="number" required placeholder="101" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="daily_rate_cents">Diária (R$)</Label>
        <Input id="daily_rate_cents" name="daily_rate_cents" placeholder="350,00" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Criar leito"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
