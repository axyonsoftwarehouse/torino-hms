"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { acceptInviteAction, type TeamActionState } from "@/modules/team/actions";

const INITIAL_STATE: TeamActionState = { ok: false };

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending}>
        {pending ? "Aceitando..." : "Aceitar convite"}
      </Button>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
