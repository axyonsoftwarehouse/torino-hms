"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centsToInput } from "@/lib/format";
import {
  addInvoiceItem,
  type InvoiceActionState,
} from "@/modules/invoices/actions";

const INITIAL_STATE: InvoiceActionState = { ok: false };

export function InvoiceItemForm({
  invoiceId,
  services,
}: {
  invoiceId: string;
  services: { id: string; name: string; price_cents: number }[];
}) {
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [state, formAction, pending] = useActionState(addInvoiceItem, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="invoice_id" value={invoiceId} />

      <div className="space-y-2">
        <Label htmlFor="service_id">Serviço</Label>
        <select
          id="service_id"
          name="service_id"
          defaultValue=""
          onChange={(event) => {
            const service = services.find((s) => s.id === event.target.value);
            if (service) {
              setDescription(service.name);
              setUnitPrice(centsToInput(service.price_cents));
            }
          }}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">— avulso —</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          name="description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Qtd.</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue="1" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit_price_cents">Valor unitário (R$)</Label>
        <Input
          id="unit_price_cents"
          name="unit_price_cents"
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          placeholder="250,00"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar item"}
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
