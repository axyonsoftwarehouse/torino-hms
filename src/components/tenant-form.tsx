"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PACKAGES } from "@/modules/core/catalog";
import { createTenant, type TenantActionState } from "@/modules/tenants/actions";

const INITIAL_STATE: TenantActionState = { ok: false };

export function TenantForm() {
  const [state, formAction, pending] = useActionState(createTenant, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required placeholder="Clínica Exemplo" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input id="slug" name="slug" required placeholder="clinica-exemplo" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="package_key">Pacote *</Label>
        <select
          id="package_key"
          name="package_key"
          defaultValue="basico"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {PACKAGES.map((pkg) => (
            <option key={pkg.key} value={pkg.key}>
              {pkg.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document">CNPJ / Documento</Label>
        <Input id="document" name="document" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">País</Label>
        <Input id="country" name="country" defaultValue="BR" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="patient_limit">Limite de pacientes</Label>
        <Input id="patient_limit" name="patient_limit" type="number" min={0} placeholder="(do pacote)" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="professional_limit">Limite de profissionais</Label>
        <Input
          id="professional_limit"
          name="professional_limit"
          type="number"
          min={0}
          placeholder="(do pacote)"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar tenant"}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
