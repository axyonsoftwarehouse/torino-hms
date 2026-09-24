import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { SaasInvoiceForm } from "@/components/saas-invoice-form";
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
import { listSaasInvoices } from "@/modules/billing/queries";
import {
  SAAS_INVOICE_STATUSES,
  SAAS_INVOICE_STATUS_LABELS,
  type SaasInvoiceStatus,
} from "@/modules/billing/schema";
import { requireSession } from "@/modules/core/session";
import { listTenants } from "@/modules/tenants/queries";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "issued") return "secondary" as const;
  return "outline" as const;
}

export default async function SaasInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  if (!session.isSuperadmin) redirect("/app");

  const { status } = await searchParams;
  const filter: SaasInvoiceStatus | "all" = SAAS_INVOICE_STATUSES.includes(
    status as SaasInvoiceStatus,
  )
    ? (status as SaasInvoiceStatus)
    : "all";

  const [invoices, tenants] = await Promise.all([
    listSaasInvoices(filter),
    listTenants(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plataforma"
        title="Faturas do SaaS"
        description={`${invoices.length} fatura(s).`}
        actions={
          <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
            {(["all", ...SAAS_INVOICE_STATUSES] as const).map((item) => (
              <Link
                key={item}
                href={`/app/billing/invoices?status=${item}`}
                className={`rounded-md px-3 py-1 text-sm ${
                  filter === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item === "all" ? "Todas" : SAAS_INVOICE_STATUS_LABELS[item]}
              </Link>
            ))}
          </div>
        }
      />

      <SaasInvoiceForm tenants={tenants} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhuma fatura.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.tenant_name ?? "—"}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>{formatCents(invoice.total_cents)}</TableCell>
                  <TableCell>{formatCents(invoice.paid_cents)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(invoice.status)}>
                      {SAAS_INVOICE_STATUS_LABELS[invoice.status as SaasInvoiceStatus] ??
                        invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/app/billing/invoices/${invoice.id}`}
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
