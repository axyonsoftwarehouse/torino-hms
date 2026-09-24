"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createExamCategory,
  type DiagnosticActionState,
} from "@/modules/diagnostics/actions";
import { EXAM_KINDS, EXAM_KIND_LABELS } from "@/modules/diagnostics/schema";

const INITIAL_STATE: DiagnosticActionState = { ok: false };

export function ExamCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createExamCategory,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="kind">Tipo *</Label>
        <select
          id="kind"
          name="kind"
          defaultValue="lab"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {EXAM_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {EXAM_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required placeholder="Hemograma / Raio-X" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" />
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "..." : "Adicionar categoria"}
        </Button>
      </div>
      {state.error ? (
        <span className="text-sm text-destructive sm:col-span-4">{state.error}</span>
      ) : null}
    </form>
  );
}
