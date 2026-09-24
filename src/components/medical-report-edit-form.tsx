"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateMedicalReport,
  type MedicalReportActionState,
} from "@/modules/medical-reports/actions";
import type { MedicalReportDetail } from "@/modules/medical-reports/queries";
import {
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
} from "@/modules/medical-reports/schema";

const INITIAL_STATE: MedicalReportActionState = { ok: false };

export function MedicalReportEditForm({
  report,
  professionals,
}: {
  report: MedicalReportDetail;
  professionals: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    updateMedicalReport,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <input type="hidden" name="id" value={report.id} />

      <div className="space-y-2">
        <Label htmlFor="report_type">Tipo *</Label>
        <select
          id="report_type"
          name="report_type"
          defaultValue={report.report_type}
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
        <Label htmlFor="professional_id">Profissional</Label>
        <select
          id="professional_id"
          name="professional_id"
          defaultValue={report.professional_id ?? ""}
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
        <Input
          id="report_date"
          name="report_date"
          type="date"
          defaultValue={report.report_date}
        />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={report.title ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="description">Conteúdo do laudo</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={report.description ?? ""}
          className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <input type="hidden" name="patient_id" value={report.patient_id} />

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar laudo"}
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
