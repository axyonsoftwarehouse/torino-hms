import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ApplyCouponForm } from "@/components/apply-coupon-form";
import { SaasAdjustmentForm } from "@/components/saas-adjustment-form";
import { SaasInvoiceItemForm } from "@/components/saas-invoice-item-form";
import { SaasPaymentForm } from "@/components/saas-payment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/payment-methods";
import {
  cancelSaasInvoice,
  deleteSaasInvoiceItem,
  issueSaasInvoice,
  removeCouponFromInvoice,
} from "@/modules/billing/actions";
import { getSaasInvoice } from "@/modules/billing/queries";
import {
  ADJUSTMENT_KIND_LABELS,
  SAAS_INVOICE_STATUS_LABELS,
  type AdjustmentKind,
  type SaasInvoiceStatus,
} from "@/modules/billing/schema";
import { requireSession } from "@/modules/core/session";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "issued") return "secondary" as const;
  return "outline" as const;
}

export default async function SaasInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!session.isSuperadmin) redirect("/app");

  const { id } = await params;
  const invoice = await getSaasInvoice(id);
  if (!invoice) notFound();

  const balance = invoice.total_cents - invoice.paid_cents;
  const canceled = invoice.status === "canceled";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/billing/invoices"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Faturas do SaaS
        </Link>
      </div>

      <PageHeader
        eyebrow="Plataforma"
        title={`Fatura ${invoice.number}`}
        description={`${invoice.tenant_name ?? "—"}${
          invoice.due_date ? ` · vence ${formatDate(invoice.due_date)}` : ""
        }`}
        actions={
          <>
            <Badge variant={statusVariant(invoice.status)}>
              {SAAS_INVOICE_STATUS_LABELS[invoice.status as SaasInvoiceStatus] ??
                invoice.status}
            </Badge>
            {invoice.status === "draft" ? (
              <form action={issueSaasInvoice}>
                <input type="hidden" name="id" value={invoice.id} />
                <Button type="submit" size="sm">
                  Emitir
                </Button>
              </form>
            ) : null}
            {!canceled ? (
              <form action={cancelSaasInvoice}>
                <input type="hidden" name="id" value={invoice.id} />
                <Button type="submit" variant="outline" size="sm">
                  Cancelar
                </Button>
              </form>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">{formatCents(invoice.total_cents)}</p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Pago</p>
          <p className="text-xl font-semibold text-emerald-600">
            {formatCents(invoice.paid_cents)}
          </p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className="text-xl font-semibold">{formatCents(balance)}</p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Créditos / Débitos / Estornos</p>
          <p className="text-sm font-medium">
            {formatCents(invoice.credits_cents)} · {formatCents(invoice.debits_cents)} ·{" "}
            {formatCents(invoice.refunds_cents)}
          </p>
        </div>
      </div>

      {invoice.coupon_code || invoice.discount_cents > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-4 text-sm">
          <span>
            <span className="text-muted-foreground">Cupom: </span>
            <strong>{invoice.coupon_code ?? "—"}</strong>
          </span>
          <span>
            <span className="text-muted-foreground">Desconto: </span>
            <strong>-{formatCents(invoice.discount_cents)}</strong>
          </span>
          {!canceled ? (
            <form action={removeCouponFromInvoice}>
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <Button type="submit" variant="ghost" size="sm">
                Remover cupom
              </Button>
            </form>
          ) : null}
        </div>
      ) : !canceled ? (
        <ApplyCouponForm invoiceId={invoice.id} />
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Itens</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>Unitário</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    Nenhum item.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCents(item.unit_price_cents)}</TableCell>
                    <TableCell>{formatCents(item.total_cents)}</TableCell>
                    <TableCell className="text-right">
                      {!canceled ? (
                        <form action={deleteSaasInvoiceItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Remover
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!canceled ? <SaasInvoiceItemForm invoiceId={invoice.id} /> : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Pagamentos</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Nenhum pagamento.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paid_at)}</TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] ?? payment.method}
                    </TableCell>
                    <TableCell>{formatCents(payment.amount_cents)}</TableCell>
                    <TableCell>{payment.reference ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!canceled ? <SaasPaymentForm invoiceId={invoice.id} /> : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Ajustes (crédito / débito / estorno)
        </h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.adjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                    Nenhum ajuste.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell>
                      {ADJUSTMENT_KIND_LABELS[adjustment.kind as AdjustmentKind] ??
                        adjustment.kind}
                    </TableCell>
                    <TableCell>{formatCents(adjustment.amount_cents)}</TableCell>
                    <TableCell>{adjustment.reason ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!canceled ? <SaasAdjustmentForm invoiceId={invoice.id} /> : null}
      </section>
    </div>
  );
}
