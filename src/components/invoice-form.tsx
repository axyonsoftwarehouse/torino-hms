"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInvoice,
  type InvoiceActionState,
} from "@/modules/invoices/actions";

const INITIAL_STATE: InvoiceActionState = { ok: false };

export function InvoiceForm({
  patients,
}: {
  patients: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createInvoice, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="patient_id">Paciente *</Label>
        <select
          id="patient_id"
          name="patient_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="due_date">Vencimento</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar fatura"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
