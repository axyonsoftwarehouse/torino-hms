"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvite, type TeamActionState } from "@/modules/team/actions";
import { TEAM_ROLES, TEAM_ROLE_LABELS } from "@/modules/team/schema";

const INITIAL_STATE: TeamActionState = { ok: false };

export function InviteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createInvite, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="email">E-mail *</Label>
        <Input id="email" name="email" type="email" required placeholder="pessoa@exemplo.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Papel</Label>
        <select
          id="role"
          name="role"
          defaultValue="professional"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {TEAM_ROLES.map((role) => (
            <option key={role} value={role}>
              {TEAM_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Convidando..." : "Convidar"}
        </Button>
      </div>
      {state.error ? (
        <span className="text-sm text-destructive sm:col-span-3">{state.error}</span>
      ) : null}
      {state.ok && state.message ? (
        <span className="text-sm text-emerald-600 sm:col-span-3">{state.message}</span>
      ) : null}
    </form>
  );
}
