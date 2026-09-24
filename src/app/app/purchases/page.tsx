import Link from "next/link";

import { PurchaseOrderForm } from "@/components/purchase-order-form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { listSuppliers } from "@/modules/pharmacy/queries";
import {
  PAYMENT_STATUS_LABELS,
  PURCHASE_FILTERS,
  PURCHASE_STATUS_LABELS,
  type PurchaseFilter,
  type PurchaseStatus,
} from "@/modules/purchases/schema";
import {
  listPurchaseOrders,
} from "@/modules/purchases/queries";

export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<PurchaseFilter, string> = {
  ordered: "Encomendadas",
  draft: "Rascunhos",
  received: "Recebidas",
  canceled: "Canceladas",
  all: "Todas",
};

function paymentVariant(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  return "outline" as const;
}

function purchaseVariant(status: string) {
  if (status === "received") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "ordered") return "secondary" as const;
  return "outline" as const;
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: PurchaseFilter = PURCHASE_FILTERS.includes(status as PurchaseFilter)
    ? (status as PurchaseFilter)
    : "all";

  const [orders, suppliers] = await Promise.all([
    listPurchaseOrders(session.activeTenantId, filter),
    listSuppliers(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
          <p className="text-sm text-muted-foreground">{orders.length} ordem(ns).</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
          {PURCHASE_FILTERS.map((item) => (
            <Link
              key={item}
              href={`/app/purchases?status=${item}`}
              className={`rounded-md px-3 py-1 text-sm ${
                filter === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {FILTER_LABELS[item]}
            </Link>
          ))}
        </div>
      </div>

      <PurchaseOrderForm suppliers={suppliers} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Compra</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhuma ordem de compra.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.number}</TableCell>
                  <TableCell>{order.supplier_name ?? "—"}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{formatCents(order.total_cents)}</TableCell>
                  <TableCell>{formatCents(order.paid_cents)}</TableCell>
                  <TableCell>
                    <Badge variant={purchaseVariant(order.status)}>
                      {PURCHASE_STATUS_LABELS[order.status as PurchaseStatus] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentVariant(order.payment_status)}>
                      {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/app/purchases/${order.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
