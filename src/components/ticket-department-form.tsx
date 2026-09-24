"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDepartment, type SupportActionState } from "@/modules/support/actions";

const INITIAL_STATE: SupportActionState = { ok: false };

export function TicketDepartmentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createDepartment, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Nome *</label>
        <Input name="name" required placeholder="TI / Manutenção / Eng. Clínica" className="w-64" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Descrição</label>
        <Input name="description" className="w-64" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "..." : "Adicionar departamento"}
      </Button>
      {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
    </form>
  );
}
