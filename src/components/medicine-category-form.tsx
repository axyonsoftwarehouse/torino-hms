"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMedicineCategory,
  type PharmacyActionState,
} from "@/modules/pharmacy/actions";

const INITIAL_STATE: PharmacyActionState = { ok: false };

export function MedicineCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createMedicineCategory,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="name">Categoria *</Label>
        <Input id="name" name="name" required placeholder="Antibiótico" className="w-48" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" className="w-56" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "..." : "Adicionar categoria"}
      </Button>
      {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
    </form>
  );
}
