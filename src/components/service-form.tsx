"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createService,
  type ServiceActionState,
} from "@/modules/services/actions";

const INITIAL_STATE: ServiceActionState = { ok: false };

export function ServiceForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createService, INITIAL_STATE);

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
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required placeholder="Consulta clínica" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Input id="category" name="category" placeholder="Consultas" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price_cents">Preço (R$)</Label>
        <Input id="price_cents" name="price_cents" placeholder="250,00" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar serviço"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
