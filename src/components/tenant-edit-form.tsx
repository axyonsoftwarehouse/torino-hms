"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PACKAGES } from "@/modules/core/catalog";
import { updateTenant, type TenantActionState } from "@/modules/tenants/actions";
import type { TenantDetail } from "@/modules/tenants/queries";

const INITIAL_STATE: TenantActionState = { ok: false };

export function TenantEditForm({ tenant }: { tenant: TenantDetail }) {
  const [state, formAction, pending] = useActionState(updateTenant, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <input type="hidden" name="id" value={tenant.id} />

      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required defaultValue={tenant.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input id="slug" name="slug" required defaultValue={tenant.slug} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="package_key">Pacote *</Label>
        <select
          id="package_key"
          name="package_key"
          defaultValue={tenant.package_key}
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
        <Input id="email" name="email" type="email" defaultValue={tenant.email ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document">CNPJ / Documento</Label>
        <Input id="document" name="document" defaultValue={tenant.document ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" defaultValue={tenant.address ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">País</Label>
        <Input id="country" name="country" defaultValue={tenant.country ?? "BR"} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="patient_limit">Limite de pacientes</Label>
        <Input
          id="patient_limit"
          name="patient_limit"
          type="number"
          min={0}
          defaultValue={tenant.patient_limit ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="professional_limit">Limite de profissionais</Label>
        <Input
          id="professional_limit"
          name="professional_limit"
          type="number"
          min={0}
          defaultValue={tenant.professional_limit ?? ""}
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
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
