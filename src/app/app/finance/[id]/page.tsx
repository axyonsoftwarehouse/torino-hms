import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceItemForm } from "@/components/invoice-item-form";
import { PaymentForm } from "@/components/payment-form";
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
import { formatCents, formatDate, formatDateTime } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payment-methods";
import { requireSession } from "@/modules/core/session";
import {
  cancelInvoice,
  deleteInvoiceItem,
  issueInvoice,
} from "@/modules/invoices/actions";
import { getInvoice } from "@/modules/invoices/queries";
import { INVOICE_STATUS_LABELS } from "@/modules/invoices/schema";
import { listServices } from "@/modules/services/queries";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "canceled":
      return "destructive" as const;
    case "issued":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const services = await listServices(session.activeTenantId);
  const balance = invoice.total_cents - invoice.paid_cents;
  const canceled = invoice.status === "canceled";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/finance" className="text-sm text-muted-foreground hover:underline">
            ← Financeiro
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Fatura {invoice.number ?? ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {invoice.patient_name ?? "—"} · Emitida {formatDate(invoice.created_at)}
            {invoice.due_date ? ` · Vence ${formatDate(invoice.due_date)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant(invoice.status)}>
            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </Badge>
          {invoice.status === "draft" ? (
            <form action={issueInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <Button type="submit" size="sm">
                Emitir
              </Button>
            </form>
          ) : null}
          {!canceled ? (
            <form action={cancelInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <Button type="submit" variant="outline" size="sm">
                Cancelar
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Itens</h2>
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
                        <form action={deleteInvoiceItem}>
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
        {!canceled ? (
          <InvoiceItemForm invoiceId={invoice.id} services={services} />
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pagamentos</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    Nenhum pagamento registrado.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDateTime(payment.paid_at)}</TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] ??
                        payment.method}
                    </TableCell>
                    <TableCell>{formatCents(payment.amount_cents)}</TableCell>
                    <TableCell>{payment.notes ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!canceled ? <PaymentForm invoiceId={invoice.id} /> : null}
      </section>
    </div>
  );
}
