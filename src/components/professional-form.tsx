"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProfessional,
  type ProfessionalActionState,
} from "@/modules/professionals/actions";
import type { DepartmentItem } from "@/modules/departments/queries";

const INITIAL_STATE: ProfessionalActionState = { ok: false };

export function ProfessionalForm({
  departments,
}: {
  departments: DepartmentItem[];
}) {
  const [state, formAction, pending] = useActionState(
    createProfessional,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="full_name">Nome completo *</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="speciality">Especialidade</Label>
        <Input id="speciality" name="speciality" placeholder="Cardiologia" />
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
        <Label htmlFor="license_number">Registro (CRM/CRO)</Label>
        <Input id="license_number" name="license_number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fee_cents">Valor da consulta (R$)</Label>
        <Input id="fee_cents" name="fee_cents" placeholder="250,00" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="bio">Bio / observações</Label>
        <textarea
          id="bio"
          name="bio"
          className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar profissional"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
