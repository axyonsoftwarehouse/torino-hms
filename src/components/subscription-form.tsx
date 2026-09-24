"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSubscription, type BillingActionState } from "@/modules/billing/actions";
import {
  BILLING_CYCLES,
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  type BillingCycle,
} from "@/modules/billing/schema";

const INITIAL_STATE: BillingActionState = { ok: false };

export function SubscriptionForm({
  tenants,
  plans,
}: {
  tenants: { id: string; name: string }[];
  plans: { key: string; name: string; monthly_price_cents: number; annual_price_cents: number }[];
}) {
  const [state, formAction, pending] = useActionState(saveSubscription, INITIAL_STATE);
  const [planKey, setPlanKey] = useState(plans[0]?.key ?? "");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [amount, setAmount] = useState("");

  function recalc(nextPlan: string, nextCycle: BillingCycle) {
    const plan = plans.find((p) => p.key === nextPlan);
    if (!plan) return;
    const cents =
      nextCycle === "annual" ? plan.annual_price_cents : plan.monthly_price_cents;
    setAmount((cents / 100).toFixed(2).replace(".", ","));
  }

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="tenant_id">Tenant *</Label>
        <select
          id="tenant_id"
          name="tenant_id"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="plan_key">Plano *</Label>
        <select
          id="plan_key"
          name="plan_key"
          value={planKey}
          onChange={(event) => {
            setPlanKey(event.target.value);
            recalc(event.target.value, cycle);
          }}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {plans.map((plan) => (
            <option key={plan.key} value={plan.key}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cycle">Ciclo</Label>
        <select
          id="cycle"
          name="cycle"
          value={cycle}
          onChange={(event) => {
            const next = event.target.value as BillingCycle;
            setCycle(next);
            recalc(planKey, next);
          }}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {BILLING_CYCLES.map((item) => (
            <option key={item} value={item}>
              {BILLING_CYCLE_LABELS[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount_cents">Valor (R$)</Label>
        <Input
          id="amount_cents"
          name="amount_cents"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="499,00"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue="active"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {SUBSCRIPTION_STATUSES.map((item) => (
            <option key={item} value={item}>
              {SUBSCRIPTION_STATUS_LABELS[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="started_at">Início</Label>
        <Input id="started_at" name="started_at" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next_due_date">Próximo vencimento</Label>
        <Input id="next_due_date" name="next_due_date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trial_ends_at">Fim do trial</Label>
        <Input id="trial_ends_at" name="trial_ends_at" type="date" />
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar assinatura"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
