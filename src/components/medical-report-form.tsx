"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMedicalReport,
  type MedicalReportActionState,
} from "@/modules/medical-reports/actions";
import {
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
} from "@/modules/medical-reports/schema";

const INITIAL_STATE: MedicalReportActionState = { ok: false };

export function MedicalReportForm({
  patients,
  professionals,
}: {
  patients: { id: string; full_name: string }[];
  professionals: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createMedicalReport,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="report_type">Tipo *</Label>
        <select
          id="report_type"
          name="report_type"
          defaultValue="general"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {REPORT_TYPE_LABELS[type]}
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
        <Label htmlFor="professional_id">Profissional</Label>
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
        <Label htmlFor="report_date">Data</Label>
        <Input id="report_date" name="report_date" type="date" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" placeholder="Ex.: Declaração de nascimento" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="description">Conteúdo do laudo</Label>
        <textarea
          id="description"
          name="description"
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar laudo"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
