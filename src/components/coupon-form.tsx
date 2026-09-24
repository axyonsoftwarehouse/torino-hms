"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCoupon, type BillingActionState } from "@/modules/billing/actions";
import {
  COUPON_DISCOUNT_TYPES,
  COUPON_DISCOUNT_TYPE_LABELS,
} from "@/modules/billing/schema";

const INITIAL_STATE: BillingActionState = { ok: false };

export function CouponForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createCoupon, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="code">Código *</Label>
        <Input id="code" name="code" required placeholder="BEMVINDO10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="discount_type">Tipo</Label>
        <select
          id="discount_type"
          name="discount_type"
          defaultValue="percent"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {COUPON_DISCOUNT_TYPES.map((type) => (
            <option key={type} value={type}>
              {COUPON_DISCOUNT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="discount_value">Valor *</Label>
        <Input id="discount_value" name="discount_value" required placeholder="10 ou 50,00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="valid_until">Válido até</Label>
        <Input id="valid_until" name="valid_until" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max_uses">Usos máximos</Label>
        <Input id="max_uses" name="max_uses" type="number" min={1} placeholder="(ilimitado)" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar cupom"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
