import Link from "next/link";

import { InvoiceForm } from "@/components/invoice-form";
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
import {
  INVOICE_FILTERS,
  INVOICE_FILTER_LABELS,
  INVOICE_STATUS_LABELS,
  type InvoiceFilter,
} from "@/modules/invoices/schema";
import { listInvoices } from "@/modules/invoices/queries";
import { listPatientOptions } from "@/modules/patients/queries";

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

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: InvoiceFilter = INVOICE_FILTERS.includes(status as InvoiceFilter)
    ? (status as InvoiceFilter)
    : "all";

  const [invoices, patients] = await Promise.all([
    listInvoices(session.activeTenantId, filter),
    listPatientOptions(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length} fatura(s).
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
          {INVOICE_FILTERS.map((item) => (
            <Link
              key={item}
              href={`/app/finance?status=${item}`}
              className={`rounded-md px-3 py-1 text-sm ${
                filter === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {INVOICE_FILTER_LABELS[item]}
            </Link>
          ))}
        </div>
      </div>

      <InvoiceForm patients={patients} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhuma fatura encontrada.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number ?? "—"}</TableCell>
                  <TableCell>{invoice.patient_name ?? "—"}</TableCell>
                  <TableCell>{formatDate(invoice.created_at)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>{formatCents(invoice.total_cents)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(invoice.status)}>
                      {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/app/finance/${invoice.id}`}
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
