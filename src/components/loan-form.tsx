"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLoan, type EquipmentActionState } from "@/modules/equipment/actions";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function LoanForm({
  equipment,
}: {
  equipment: { id: string; name: string; location: string | null }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createLoan, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="equipment_id">Equipamento *</Label>
        <select
          id="equipment_id"
          name="equipment_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {equipment.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.location ? ` (${item.location})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sector">Setor de destino *</Label>
        <Input id="sector" name="sector" required placeholder="UTI / Enfermaria / Centro cirúrgico" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="received_by">Recebido por</Label>
        <Input id="received_by" name="received_by" placeholder="Quem recebeu no setor" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="patient_reference">Referência / leito / paciente</Label>
        <Input id="patient_reference" name="patient_reference" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="condition_out">Condição na entrega</Label>
        <Input id="condition_out" name="condition_out" placeholder="Bom estado / com ressalva" />
      </div>
      <div className="flex items-end gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="isolation" className="size-4 rounded border" />
          Isolamento / doença infecciosa
        </label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="infection_notes">Observações de infecção</Label>
        <Input id="infection_notes" name="infection_notes" placeholder="Precauções / agente" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar entrega"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
