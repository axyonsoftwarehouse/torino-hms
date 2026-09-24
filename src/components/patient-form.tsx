"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPatient, type PatientActionState } from "@/modules/patients/actions";

const INITIAL_STATE: PatientActionState = { ok: false };

export function PatientForm({
  companies,
}: {
  companies: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createPatient, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="full_name">Nome completo *</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document">CPF / Documento</Label>
        <Input id="document" name="document" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birth_date">Data de nascimento</Label>
        <Input id="birth_date" name="birth_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">Sexo</Label>
        <Input id="gender" name="gender" placeholder="F / M / outro" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="insurance_company_id">Convênio</Label>
        <select
          id="insurance_company_id"
          name="insurance_company_id"
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">— particular —</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="insurance_card_number">Carteirinha</Label>
        <Input id="insurance_card_number" name="insurance_card_number" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar paciente"}
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
