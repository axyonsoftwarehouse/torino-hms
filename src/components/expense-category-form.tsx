"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createExpenseCategory,
  type ExpenseActionState,
} from "@/modules/expenses/actions";

const INITIAL_STATE: ExpenseActionState = { ok: false };

export function ExpenseCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createExpenseCategory,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <Input name="name" placeholder="Nova categoria" required className="max-w-52" />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "..." : "Adicionar"}
      </Button>
      {state.error ? (
        <span className="text-sm text-destructive">{state.error}</span>
      ) : null}
    </form>
  );
}
