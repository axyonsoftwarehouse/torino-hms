"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDocument, type FleetActionState } from "@/modules/fleet/actions";

const INITIAL_STATE: FleetActionState = { ok: false };

export function DocumentForm({ vehicleId }: { vehicleId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createDocument, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <div className="space-y-2">
        <Label htmlFor="doc_type">Documento</Label>
        <select id="doc_type" name="doc_type" defaultValue="crlv" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          <option value="crlv">CRLV</option>
          <option value="insurance">Seguro</option>
          <option value="ipva">IPVA</option>
          <option value="inspection">Vistoria</option>
          <option value="other">Outro</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">Número</Label>
        <Input id="number" name="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issued_at">Emissão</Label>
        <Input id="issued_at" name="issued_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expires_at">Vencimento</Label>
        <Input id="expires_at" name="expires_at" type="date" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar documento"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
