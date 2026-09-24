"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centsToInput } from "@/lib/format";
import {
  createEquipment,
  updateEquipment,
  type EquipmentActionState,
} from "@/modules/equipment/actions";
import type { EquipmentDetail } from "@/modules/equipment/queries";
import {
  EQUIPMENT_CRITICALITIES,
  EQUIPMENT_CRITICALITY_LABELS,
  EQUIPMENT_STATUSES,
  EQUIPMENT_STATUS_LABELS,
} from "@/modules/equipment/schema";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function EquipmentForm({
  categories,
  equipment,
}: {
  categories: { id: string; name: string }[];
  equipment?: EquipmentDetail;
}) {
  const editing = Boolean(equipment);
  const [state, formAction, pending] = useActionState(
    editing ? updateEquipment : createEquipment,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {editing ? <input type="hidden" name="id" value={equipment!.id} /> : null}

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required defaultValue={equipment?.name ?? ""} placeholder="Monitor multiparâmetro" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="asset_tag">Patrimônio</Label>
        <Input id="asset_tag" name="asset_tag" defaultValue={equipment?.asset_tag ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={equipment?.category_id ?? ""}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="serial_number">Nº de série</Label>
        <Input id="serial_number" name="serial_number" defaultValue={equipment?.serial_number ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="manufacturer">Fabricante</Label>
        <Input id="manufacturer" name="manufacturer" defaultValue={equipment?.manufacturer ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="model">Modelo</Label>
        <Input id="model" name="model" defaultValue={equipment?.model ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="anvisa_registration">Registro ANVISA</Label>
        <Input id="anvisa_registration" name="anvisa_registration" defaultValue={equipment?.anvisa_registration ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Setor / localização</Label>
        <Input id="location" name="location" defaultValue={equipment?.location ?? ""} placeholder="UTI / Centro cirúrgico" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="responsible">Responsável</Label>
        <Input id="responsible" name="responsible" defaultValue={equipment?.responsible ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="criticality">Criticidade</Label>
        <select
          id="criticality"
          name="criticality"
          defaultValue={equipment?.criticality ?? "medium"}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {EQUIPMENT_CRITICALITIES.map((value) => (
            <option key={value} value={value}>
              {EQUIPMENT_CRITICALITY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={equipment?.status ?? "active"}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {EQUIPMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {EQUIPMENT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="acquisition_date">Data de aquisição</Label>
        <Input
          id="acquisition_date"
          name="acquisition_date"
          type="date"
          defaultValue={equipment?.acquisition_date ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="acquisition_value_cents">Valor (R$)</Label>
        <Input
          id="acquisition_value_cents"
          name="acquisition_value_cents"
          defaultValue={equipment ? centsToInput(equipment.acquisition_value_cents) : ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="warranty_until">Garantia até</Label>
        <Input
          id="warranty_until"
          name="warranty_until"
          type="date"
          defaultValue={equipment?.warranty_until ?? ""}
        />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" defaultValue={equipment?.notes ?? ""} />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar equipamento"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
