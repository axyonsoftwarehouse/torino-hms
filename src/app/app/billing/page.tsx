import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/format";
import { getBillingSummary } from "@/modules/billing/queries";
import { requireSession } from "@/modules/core/session";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await requireSession();
  if (!session.isSuperadmin) redirect("/app");

  const summary = await getBillingSummary();
  const cards = [
    { label: "MRR", value: formatCents(summary.mrrCents), hint: `${summary.activeSubscriptions} assinatura(s) ativa(s)` },
    { label: "Recebido no mês", value: formatCents(summary.receivedThisMonthCents), hint: "pagamentos do SaaS" },
    { label: "Em aberto", value: formatCents(summary.openCents), hint: "faturas emitidas não pagas" },
    { label: "Faturas em atraso", value: String(summary.overdueCount), hint: "vencidas e em aberto" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plataforma"
        title="Billing do SaaS"
        description="Assinaturas e faturas dos tenants."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="border-transparent shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/billing/subscriptions"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Assinaturas e preços
        </Link>
        <Link
          href="/app/billing/invoices"
          className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Faturas do SaaS
        </Link>
      </div>
    </div>
  );
}
