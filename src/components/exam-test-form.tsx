"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createExamTest,
  type DiagnosticActionState,
} from "@/modules/diagnostics/actions";

const INITIAL_STATE: DiagnosticActionState = { ok: false };

export function ExamTestForm({
  categories,
}: {
  categories: { id: string; name: string; kind: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createExamTest, INITIAL_STATE);

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
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue=""
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
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required placeholder="Hemograma completo" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price_cents">Preço (R$)</Label>
        <Input id="price_cents" name="price_cents" placeholder="40,00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration_minutes">Duração (min)</Label>
        <Input id="duration_minutes" name="duration_minutes" type="number" min={0} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reference_value">Valor de referência</Label>
        <Input id="reference_value" name="reference_value" placeholder="4.000–11.000 /µL" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="preparation_instructions">Preparo / instruções</Label>
        <Input id="preparation_instructions" name="preparation_instructions" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar exame"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
