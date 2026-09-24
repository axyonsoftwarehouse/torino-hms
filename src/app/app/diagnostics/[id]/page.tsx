import Link from "next/link";
import { notFound } from "next/navigation";

import { ExamOrderItemForm } from "@/components/exam-order-item-form";
import { ExamResultForm } from "@/components/exam-result-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents, formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import {
  deleteExamOrderItem,
  setExamOrderStatus,
} from "@/modules/diagnostics/actions";
import { getExamOrder, listExamTests } from "@/modules/diagnostics/queries";
import {
  EXAM_KIND_LABELS,
  EXAM_STATUSES,
  EXAM_STATUS_LABELS,
  EXAM_URGENCY_LABELS,
  type ExamKind,
  type ExamStatus,
  type ExamUrgency,
} from "@/modules/diagnostics/schema";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "completed" || status === "delivered") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  return "secondary" as const;
}

export default async function ExamOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const order = await getExamOrder(id);
  if (!order) notFound();

  const tests = await listExamTests(session.activeTenantId);
  const editable = order.status !== "delivered" && order.status !== "canceled";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/diagnostics" className="text-sm text-muted-foreground hover:underline">
            ← Exames
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Pedido {order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.patient_name ?? "—"}
            {order.professional_name ? ` · Solicitante: ${order.professional_name}` : ""}
            {` · ${EXAM_KIND_LABELS[order.kind as ExamKind] ?? order.kind}`}
            {` · ${EXAM_URGENCY_LABELS[order.urgency as ExamUrgency] ?? order.urgency}`}
          </p>
        </div>
        <Badge variant={statusVariant(order.status)}>
          {EXAM_STATUS_LABELS[order.status as ExamStatus] ?? order.status}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {EXAM_STATUSES.filter((status) => status !== "canceled").map((status) => (
          <form key={status} action={setExamOrderStatus}>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              size="sm"
              variant={order.status === status ? "default" : "outline"}
            >
              {EXAM_STATUS_LABELS[status]}
            </Button>
          </form>
        ))}
        {editable ? (
          <form action={setExamOrderStatus}>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="status" value="canceled" />
            <Button type="submit" size="sm" variant="ghost">
              Cancelar
            </Button>
          </form>
        ) : null}
      </div>

      {order.clinical_notes ? (
        <div className="rounded-xl border bg-background p-4 text-sm">
          <span className="text-muted-foreground">Indicação clínica: </span>
          {order.clinical_notes}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Exames solicitados</h2>
          <span className="text-sm text-muted-foreground">
            Total: {formatCents(order.total_cents)}
          </span>
        </div>

        <div className="space-y-4">
          {order.items.length === 0 ? (
            <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
              Nenhum exame adicionado.
            </p>
          ) : (
            order.items.map((item) => (
              <div key={item.id} className="space-y-3 rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {item.test_name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatCents(item.price_cents)} × {item.quantity}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                      {item.status === "completed" ? "Concluído" : "Pendente"}
                    </Badge>
                    {editable ? (
                      <form action={deleteExamOrderItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="order_id" value={order.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Remover
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
                {editable ? (
                  <ExamResultForm
                    itemId={item.id}
                    orderId={order.id}
                    result={item.result}
                    referenceValue={item.reference_value}
                  />
                ) : item.result ? (
                  <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                    {item.result}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>

        {editable ? <ExamOrderItemForm orderId={order.id} tests={tests} /> : null}
      </section>

      <p className="text-xs text-muted-foreground">
        Aberto em {formatDateTime(order.order_date)}
      </p>
    </div>
  );
}
