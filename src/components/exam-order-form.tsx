"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createExamOrder,
  type DiagnosticActionState,
} from "@/modules/diagnostics/actions";
import {
  EXAM_KINDS,
  EXAM_KIND_LABELS,
  EXAM_URGENCIES,
  EXAM_URGENCY_LABELS,
} from "@/modules/diagnostics/schema";

const INITIAL_STATE: DiagnosticActionState = { ok: false };

export function ExamOrderForm({
  patients,
  professionals,
}: {
  patients: { id: string; full_name: string }[];
  professionals: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createExamOrder, INITIAL_STATE);

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
        <Label htmlFor="professional_id">Solicitante</Label>
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
        <Label htmlFor="urgency">Urgência</Label>
        <select
          id="urgency"
          name="urgency"
          defaultValue="routine"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {EXAM_URGENCIES.map((urgency) => (
            <option key={urgency} value={urgency}>
              {EXAM_URGENCY_LABELS[urgency]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="clinical_notes">Indicação clínica</Label>
        <Input id="clinical_notes" name="clinical_notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Abrindo..." : "Abrir pedido de exames"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
