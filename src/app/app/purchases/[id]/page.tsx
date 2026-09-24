import Link from "next/link";
import { notFound } from "next/navigation";

import { PurchaseItemForm } from "@/components/purchase-item-form";
import { PurchasePaymentForm } from "@/components/purchase-payment-form";
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
import { requireSession } from "@/modules/core/session";
import { listMedicines } from "@/modules/pharmacy/queries";
import {
  cancelPurchaseOrder,
  deletePurchaseItem,
  deletePurchasePayment,
  receivePurchaseOrder,
} from "@/modules/purchases/actions";
import { getPurchaseOrder } from "@/modules/purchases/queries";
import {
  PAYMENT_STATUS_LABELS,
  PURCHASE_STATUS_LABELS,
  type PurchaseStatus,
} from "@/modules/purchases/schema";

export const dynamic = "force-dynamic";

function purchaseVariant(status: string) {
  if (status === "received") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "ordered") return "secondary" as const;
  return "outline" as const;
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const order = await getPurchaseOrder(id);
  if (!order) notFound();

  const medicines = await listMedicines(session.activeTenantId);
  const balance = order.total_cents - order.paid_cents;
  const canReceive = order.status === "ordered" || order.status === "draft";
  const canEdit = order.status !== "received" && order.status !== "canceled";

  const payStatus =
    order.total_cents > 0 && order.paid_cents >= order.total_cents
      ? "paid"
      : order.paid_cents > 0
        ? "partial"
        : "pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/purchases" className="text-sm text-muted-foreground hover:underline">
            ← Compras
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Ordem {order.number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.supplier_name ?? "Sem fornecedor"} · Pedido {formatDate(order.order_date)}
            {order.expected_delivery_date
              ? ` · Entrega prevista ${formatDate(order.expected_delivery_date)}`
              : ""}
            {order.invoice_number ? ` · NF ${order.invoice_number}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={purchaseVariant(order.status)}>
            {PURCHASE_STATUS_LABELS[order.status as PurchaseStatus] ?? order.status}
          </Badge>
          {canReceive ? (
            <form action={receivePurchaseOrder}>
              <input type="hidden" name="id" value={order.id} />
              <Button type="submit" size="sm">
                Receber (entrada em estoque)
              </Button>
            </form>
          ) : null}
          {canEdit ? (
            <form action={cancelPurchaseOrder}>
              <input type="hidden" name="id" value={order.id} />
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
          <p className="text-xl font-semibold">{formatCents(order.total_cents)}</p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Pago</p>
          <p className="text-xl font-semibold text-emerald-600">
            {formatCents(order.paid_cents)}
          </p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Saldo · {PAYMENT_STATUS_LABELS[payStatus]}
          </p>
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
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>Custo unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                    Nenhum item.
                  </TableCell>
                </TableRow>
              ) : (
                order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.description ?? item.medicine_name ?? "—"}
                    </TableCell>
                    <TableCell>{item.batch_number ?? "—"}</TableCell>
                    <TableCell>{formatDate(item.expiry_date)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCents(item.unit_cost_cents)}</TableCell>
                    <TableCell>{formatCents(item.total_cents)}</TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <form action={deletePurchaseItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="purchase_order_id" value={order.id} />
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
        {canEdit ? <PurchaseItemForm orderId={order.id} medicines={medicines} /> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pagamentos (contas a pagar)</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                    Nenhum pagamento.
                  </TableCell>
                </TableRow>
              ) : (
                order.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paid_at)}</TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] ?? payment.method}
                    </TableCell>
                    <TableCell>{formatCents(payment.amount_cents)}</TableCell>
                    <TableCell>{payment.reference ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <form action={deletePurchasePayment}>
                        <input type="hidden" name="id" value={payment.id} />
                        <input type="hidden" name="purchase_order_id" value={order.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Remover
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PurchasePaymentForm orderId={order.id} />
      </section>
    </div>
  );
}
