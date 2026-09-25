"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDriver, type FleetActionState } from "@/modules/fleet/actions";

const INITIAL_STATE: FleetActionState = { ok: false };

export function DriverForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createDriver, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome *</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnh_number">CNH</Label>
        <Input id="cnh_number" name="cnh_number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnh_category">Categoria</Label>
        <Input id="cnh_category" name="cnh_category" placeholder="B / D / E" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnh_expires_at">Validade da CNH</Label>
        <Input id="cnh_expires_at" name="cnh_expires_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar motorista"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
