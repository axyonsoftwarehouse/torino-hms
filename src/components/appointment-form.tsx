"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAppointment,
  type AppointmentActionState,
} from "@/modules/appointments/actions";

const INITIAL_STATE: AppointmentActionState = { ok: false };

export function AppointmentForm({
  patients,
  professionals,
}: {
  patients: { id: string; full_name: string }[];
  professionals: { id: string; full_name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createAppointment,
    INITIAL_STATE,
  );

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
        <Label htmlFor="type">Tipo de atendimento</Label>
        <Input id="type" name="type" placeholder="Primeira consulta / Retorno" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="scheduled_start">Início *</Label>
        <Input id="scheduled_start" name="scheduled_start" type="datetime-local" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="scheduled_end">Término</Label>
        <Input id="scheduled_end" name="scheduled_end" type="datetime-local" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fee_cents">Valor (R$)</Label>
        <Input id="fee_cents" name="fee_cents" placeholder="250,00" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="reason">Motivo / observações</Label>
        <Input id="reason" name="reason" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Agendando..." : "Agendar consulta"}
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
