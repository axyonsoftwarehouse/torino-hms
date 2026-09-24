import Link from "next/link";

import { ExamOrderForm } from "@/components/exam-order-form";
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
import { formatCents, formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteExamOrder } from "@/modules/diagnostics/actions";
import { listExamOrders } from "@/modules/diagnostics/queries";
import {
  EXAM_FILTERS,
  EXAM_KIND_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_URGENCY_LABELS,
  type ExamFilter,
  type ExamKind,
  type ExamStatus,
  type ExamUrgency,
} from "@/modules/diagnostics/schema";
import { listPatientOptions } from "@/modules/patients/queries";
import { listProfessionalOptions } from "@/modules/professionals/queries";

export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<ExamFilter, string> = {
  pending: "Pendentes",
  collected: "Coletados",
  in_progress: "Em análise",
  completed: "Concluídos",
  delivered: "Entregues",
  canceled: "Cancelados",
  all: "Todos",
};

function statusVariant(status: string) {
  if (status === "completed" || status === "delivered") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  return "secondary" as const;
}

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: ExamFilter = EXAM_FILTERS.includes(status as ExamFilter)
    ? (status as ExamFilter)
    : "all";

  const [orders, patients, professionals] = await Promise.all([
    listExamOrders(session.activeTenantId, filter),
    listPatientOptions(session.activeTenantId),
    listProfessionalOptions(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exames</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} pedido(s).
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
          {EXAM_FILTERS.map((item) => (
            <Link
              key={item}
              href={`/app/diagnostics?status=${item}`}
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

      <div className="flex justify-end">
        <Link
          href="/app/diagnostics/catalog"
          className="text-sm font-medium text-primary hover:underline"
        >
          Catálogo de exames →
        </Link>
      </div>

      <ExamOrderForm patients={patients} professionals={professionals} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Urgência</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhum pedido de exame.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{formatDateTime(order.order_date)}</TableCell>
                  <TableCell>{order.patient_name ?? "—"}</TableCell>
                  <TableCell>
                    {EXAM_KIND_LABELS[order.kind as ExamKind] ?? order.kind}
                  </TableCell>
                  <TableCell>
                    {EXAM_URGENCY_LABELS[order.urgency as ExamUrgency] ?? order.urgency}
                  </TableCell>
                  <TableCell>{formatCents(order.total_cents)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>
                      {EXAM_STATUS_LABELS[order.status as ExamStatus] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Link
                      href={`/app/diagnostics/${order.id}`}
                      className="inline-flex h-7 items-center rounded-md px-2.5 text-sm font-medium hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <form action={deleteExamOrder}>
                      <input type="hidden" name="id" value={order.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Excluir
                      </Button>
                    </form>
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
