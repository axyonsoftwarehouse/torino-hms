"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateEncounter,
  type EncounterActionState,
} from "@/modules/encounters/actions";
import type { EncounterDetail } from "@/modules/encounters/queries";

const INITIAL_STATE: EncounterActionState = { ok: false };

export function EncounterEditForm({ encounter }: { encounter: EncounterDetail }) {
  const [state, formAction, pending] = useActionState(updateEncounter, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="id" value={encounter.id} />
      <input type="hidden" name="patient_id" value={encounter.patient_id} />
      <input type="hidden" name="professional_id" value={encounter.professional_id ?? ""} />
      <input type="hidden" name="appointment_id" value={encounter.appointment_id ?? ""} />

      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="chief_complaint">Queixa principal</Label>
        <Input
          id="chief_complaint"
          name="chief_complaint"
          defaultValue={encounter.chief_complaint ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight_kg">Peso (kg)</Label>
        <Input id="weight_kg" name="weight_kg" defaultValue={encounter.weight_kg ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="height_cm">Altura (cm)</Label>
        <Input id="height_cm" name="height_cm" defaultValue={encounter.height_cm ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="blood_pressure">Pressão arterial</Label>
        <Input
          id="blood_pressure"
          name="blood_pressure"
          placeholder="120/80"
          defaultValue={encounter.blood_pressure ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="temperature_c">Temperatura (°C)</Label>
        <Input
          id="temperature_c"
          name="temperature_c"
          defaultValue={encounter.temperature_c ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="heart_rate">Freq. cardíaca (bpm)</Label>
        <Input
          id="heart_rate"
          name="heart_rate"
          type="number"
          defaultValue={encounter.heart_rate ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diagnosis_code">CID</Label>
        <Input
          id="diagnosis_code"
          name="diagnosis_code"
          placeholder="A90"
          defaultValue={encounter.diagnosis_code ?? ""}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Input id="diagnosis" name="diagnosis" defaultValue={encounter.diagnosis ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Evolução / observações</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={encounter.notes ?? ""}
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar atendimento"}
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
