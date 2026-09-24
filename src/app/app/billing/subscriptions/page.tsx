import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { SubscriptionForm } from "@/components/subscription-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { centsToInput, formatCents } from "@/lib/format";
import { updatePlanPrice } from "@/modules/billing/actions";
import { listPlans, listSubscriptions } from "@/modules/billing/queries";
import {
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type BillingCycle,
  type SubscriptionStatus,
} from "@/modules/billing/schema";
import { requireSession } from "@/modules/core/session";
import { listTenants } from "@/modules/tenants/queries";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "trial") return "secondary" as const;
  if (status === "past_due" || status === "suspended") return "warning" as const;
  if (status === "canceled") return "destructive" as const;
  return "outline" as const;
}

export default async function SubscriptionsPage() {
  const session = await requireSession();
  if (!session.isSuperadmin) redirect("/app");

  const [tenants, plans, subscriptions] = await Promise.all([
    listTenants(),
    listPlans(),
    listSubscriptions(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plataforma"
        title="Assinaturas"
        description="Defina o plano contratado por cada tenant."
      />

      <SubscriptionForm tenants={tenants} plans={plans} />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Assinaturas</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próx. vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma assinatura definida.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.tenant_name ?? "—"}</TableCell>
                    <TableCell>{sub.plan_name ?? sub.plan_key}</TableCell>
                    <TableCell>
                      {BILLING_CYCLE_LABELS[sub.cycle as BillingCycle] ?? sub.cycle}
                    </TableCell>
                    <TableCell>{formatCents(sub.amount_cents)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(sub.status)}>
                        {SUBSCRIPTION_STATUS_LABELS[sub.status as SubscriptionStatus] ??
                          sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.next_due_date ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">Preços dos planos</h2>
          <p className="text-sm text-muted-foreground">
            Valores usados ao criar a assinatura e a fatura do tenant.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <form
              key={plan.key}
              action={updatePlanPrice}
              className="space-y-3 rounded-xl border bg-background p-4"
            >
              <input type="hidden" name="key" value={plan.key} />
              <p className="font-medium">{plan.name}</p>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Mensal (R$)</label>
                <Input
                  name="monthly_price_cents"
                  defaultValue={centsToInput(plan.monthly_price_cents)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Anual (R$)</label>
                <Input
                  name="annual_price_cents"
                  defaultValue={centsToInput(plan.annual_price_cents)}
                />
              </div>
              <Button type="submit" variant="outline" size="sm">
                Salvar preços
              </Button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
