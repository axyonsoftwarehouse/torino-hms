"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { admitPatient, type BedActionState } from "@/modules/beds/actions";

const INITIAL_STATE: BedActionState = { ok: false };

export function AdmissionForm({
  beds,
  patients,
  professionals,
}: {
  beds: { id: string; number: string; category_name: string | null }[];
  patients: { id: string; full_name: string }[];
  professionals: { id: string; full_name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(admitPatient, INITIAL_STATE);

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
        <Label htmlFor="bed_id">Leito disponível *</Label>
        <select
          id="bed_id"
          name="bed_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {beds.map((bed) => (
            <option key={bed.id} value={bed.id}>
              {bed.number}
              {bed.category_name ? ` — ${bed.category_name}` : ""}
            </option>
          ))}
        </select>
      </div>
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
        <Label htmlFor="professional_id">Médico responsável</Label>
        <select
          id="professional_id"
          name="professional_id"
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Hipótese diagnóstica</Label>
        <Input id="diagnosis" name="diagnosis" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending || beds.length === 0}>
          {pending ? "Internando..." : "Internar paciente"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
