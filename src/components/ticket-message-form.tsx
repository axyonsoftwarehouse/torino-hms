"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addTicketMessage, type SupportActionState } from "@/modules/support/actions";

const INITIAL_STATE: SupportActionState = { ok: false };

export function TicketMessageForm({ ticketId }: { ticketId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addTicketMessage, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-xl border bg-background p-4">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <div className="space-y-2">
        <Label htmlFor="body">Responder</Label>
        <textarea
          id="body"
          name="body"
          required
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="is_internal" className="size-4 rounded border" />
          Nota interna (não visível ao solicitante)
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar resposta"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
