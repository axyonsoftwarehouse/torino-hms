"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addExamOrderItem,
  type DiagnosticActionState,
} from "@/modules/diagnostics/actions";

const INITIAL_STATE: DiagnosticActionState = { ok: false };

export function ExamOrderItemForm({
  orderId,
  tests,
}: {
  orderId: string;
  tests: { id: string; name: string; category_name: string | null }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addExamOrderItem, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-3"
    >
      <input type="hidden" name="order_id" value={orderId} />

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="test_id">Exame *</Label>
        <select
          id="test_id"
          name="test_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {tests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.name}
              {test.category_name ? ` — ${test.category_name}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Qtd.</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue="1" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-3">
        <Button type="submit" disabled={pending || tests.length === 0}>
          {pending ? "Adicionando..." : "Adicionar exame"}
        </Button>
        {tests.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Cadastre exames no catálogo primeiro.
          </span>
        ) : null}
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
