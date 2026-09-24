"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTicket, type SupportActionState } from "@/modules/support/actions";
import { TICKET_PRIORITIES, TICKET_PRIORITY_LABELS } from "@/modules/support/schema";

const INITIAL_STATE: SupportActionState = { ok: false };

export function TicketForm({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createTicket, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="subject">Assunto *</Label>
        <Input id="subject" name="subject" required placeholder="Ex.: Impressora da recepção não imprime" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department_id">Departamento</Label>
        <select
          id="department_id"
          name="department_id"
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priority">Prioridade</Label>
        <select
          id="priority"
          name="priority"
          defaultValue="normal"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {TICKET_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Abrindo..." : "Abrir chamado"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
