import Link from "next/link";

import { LoanForm } from "@/components/loan-form";
import { PageHeader } from "@/components/page-header";
import { ReturnLoanForm } from "@/components/return-loan-form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { listEquipment, listLoans } from "@/modules/equipment/queries";
import { LOAN_FILTERS, type LoanFilter } from "@/modules/equipment/schema";

export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<LoanFilter, string> = {
  active: "Em aberto",
  returned: "Recolhidos",
  all: "Todos",
};

export default async function EquipmentMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: LoanFilter = LOAN_FILTERS.includes(status as LoanFilter)
    ? (status as LoanFilter)
    : "all";

  const [activeLoans, loans, equipment] = await Promise.all([
    listLoans(session.activeTenantId, "active"),
    listLoans(session.activeTenantId, filter),
    listEquipment(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/equipment" className="text-sm text-muted-foreground hover:underline">
          ← Engenharia Clínica
        </Link>
      </div>

      <PageHeader
        eyebrow="Engenharia Clínica"
        title="Movimentações de equipamentos"
        description="Entrega e recolhimento nos setores, com rastreabilidade."
        actions={
          <Link
            href="/app/equipment/indicators"
            className="text-sm font-medium text-primary hover:underline"
          >
            Indicadores →
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
        {LOAN_FILTERS.map((item) => (
          <Link
            key={item}
            href={`/app/equipment/movements?status=${item}`}
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

      <LoanForm
        equipment={equipment.map((e) => ({ id: e.id, name: e.name, location: e.location }))}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Entregas em aberto ({activeLoans.length})
        </h2>
        {activeLoans.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhum equipamento em posse de setor.
          </p>
        ) : (
          activeLoans.map((loan) => (
            <div key={loan.id} className="space-y-3 rounded-xl border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {loan.equipment_name ?? "Equipamento"} → <strong>{loan.sector}</strong>
                    {loan.isolation ? (
                      <Badge variant="destructive" className="ml-2">
                        Isolamento
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entregue {formatDateTime(loan.delivered_at)}
                    {loan.received_by ? ` · recebido por ${loan.received_by}` : ""}
                    {loan.patient_reference ? ` · ${loan.patient_reference}` : ""}
                    {loan.condition_out ? ` · ${loan.condition_out}` : ""}
                  </p>
                  {loan.infection_notes ? (
                    <p className="text-xs text-destructive">Precauções: {loan.infection_notes}</p>
                  ) : null}
                </div>
              </div>
              <ReturnLoanForm loanId={loan.id} requiresDisinfection={loan.isolation} />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Histórico</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Recolhimento</TableHead>
                <TableHead>Desinfecção</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Nenhuma movimentação.
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.equipment_name ?? "—"}</TableCell>
                    <TableCell>
                      {loan.sector}
                      {loan.isolation ? (
                        <Badge variant="destructive" className="ml-2">
                          Isolamento
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatDateTime(loan.delivered_at)}</TableCell>
                    <TableCell>
                      {loan.returned_at ? formatDateTime(loan.returned_at) : "—"}
                    </TableCell>
                    <TableCell>
                      {loan.disinfection_done ? (
                        <Badge variant="success">Feita</Badge>
                      ) : loan.isolation ? (
                        <Badge variant="warning">Pendente</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={loan.status === "loaned" ? "secondary" : "outline"}>
                        {loan.status === "loaned" ? "Em posse do setor" : "Recolhido"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
