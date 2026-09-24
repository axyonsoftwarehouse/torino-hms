"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { closeServiceOrder, type EquipmentActionState } from "@/modules/equipment/actions";
import { SERVICE_ORDER_STATUSES, SERVICE_ORDER_STATUS_LABELS } from "@/modules/equipment/schema";

const INITIAL_STATE: EquipmentActionState = { ok: false };

export function ServiceOrderCloseForm({
  orderId,
  technician,
  costCents,
}: {
  orderId: string;
  technician: string | null;
  costCents: number;
}) {
  const [state, formAction, pending] = useActionState(closeServiceOrder, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
      <input type="hidden" name="id" value={orderId} />
      <div className="space-y-2">
        <Label htmlFor={`status-${orderId}`} className="text-xs text-muted-foreground">Status</Label>
        <select
          id={`status-${orderId}`}
          name="status"
          defaultValue="done"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {SERVICE_ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {SERVICE_ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`technician-${orderId}`} className="text-xs text-muted-foreground">Técnico</Label>
        <Input id={`technician-${orderId}`} name="technician" defaultValue={technician ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`cost-${orderId}`} className="text-xs text-muted-foreground">Custo (R$)</Label>
        <Input
          id={`cost-${orderId}`}
          name="cost_cents"
          defaultValue={costCents ? (costCents / 100).toFixed(2).replace(".", ",") : ""}
        />
      </div>
      <div className="space-y-2 sm:col-span-3">
        <Label htmlFor={`findings-${orderId}`} className="text-xs text-muted-foreground">
          Laudo / conclusão
        </Label>
        <textarea
          id={`findings-${orderId}`}
          name="findings"
          className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`cert-${orderId}`} className="text-xs text-muted-foreground">
          Certificado de calibração (nº)
        </Label>
        <Input id={`cert-${orderId}`} name="certificate_number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`cert-exp-${orderId}`} className="text-xs text-muted-foreground">
          Validade do certificado
        </Label>
        <Input id={`cert-exp-${orderId}`} name="certificate_expires_at" type="date" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Atualizar OS"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
