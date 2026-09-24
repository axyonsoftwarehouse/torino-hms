"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSchedule,
  type ScheduleActionState,
} from "@/modules/schedules/actions";
import { WEEKDAYS } from "@/modules/schedules/slots";

const INITIAL_STATE: ScheduleActionState = { ok: false };

export function ScheduleForm({ professionalId }: { professionalId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createSchedule, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="professional_id" value={professionalId} />

      <div className="space-y-2">
        <Label htmlFor="weekday">Dia *</Label>
        <select
          id="weekday"
          name="weekday"
          required
          defaultValue="1"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {WEEKDAYS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="start_time">Início *</Label>
        <Input id="start_time" name="start_time" type="time" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="end_time">Fim *</Label>
        <Input id="end_time" name="end_time" type="time" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slot_minutes">Duração (min)</Label>
        <Input id="slot_minutes" name="slot_minutes" type="number" min={5} placeholder="30" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar disponibilidade"}
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
