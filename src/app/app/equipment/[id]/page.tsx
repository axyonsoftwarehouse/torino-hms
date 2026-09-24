import Link from "next/link";
import { notFound } from "next/navigation";

import { EquipmentForm } from "@/components/equipment-form";
import { ContractForm } from "@/components/contract-form";
import { IncidentForm } from "@/components/incident-form";
import { MaintenancePlanForm } from "@/components/maintenance-plan-form";
import { ServiceOrderCloseForm } from "@/components/service-order-close-form";
import { ServiceOrderForm } from "@/components/service-order-form";
import { PageHeader } from "@/components/page-header";
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
import { requireSession } from "@/modules/core/session";
import {
  deleteContract,
  deleteIncident,
  deleteMaintenancePlan,
  deleteServiceOrder,
} from "@/modules/equipment/actions";
import { getEquipment, listEquipmentCategories } from "@/modules/equipment/queries";
import {
  EQUIPMENT_CRITICALITY_LABELS,
  EQUIPMENT_CONTRACT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
  INCIDENT_SEVERITY_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_TYPE_LABELS,
  type EquipmentContractType,
  type EquipmentCriticality,
  type EquipmentStatus,
  type IncidentSeverity,
  type ServiceOrderStatus,
  type ServiceOrderType,
} from "@/modules/equipment/schema";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "done") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "in_progress") return "warning" as const;
  return "secondary" as const;
}

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const equipment = await getEquipment(id);
  if (!equipment) notFound();

  const categories = await listEquipmentCategories(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/equipment" className="text-sm text-muted-foreground hover:underline">
          ← Engenharia Clínica
        </Link>
      </div>

      <PageHeader
        eyebrow={equipment.category_name ?? "Equipamento"}
        title={equipment.name}
        description={`${equipment.asset_tag ?? "sem patrimônio"}${
          equipment.location ? ` · ${equipment.location}` : ""
        }`}
        actions={
          <>
            <Badge variant={equipment.criticality === "high" ? "destructive" : "warning"}>
              Criticidade{" "}
              {EQUIPMENT_CRITICALITY_LABELS[equipment.criticality as EquipmentCriticality] ??
                equipment.criticality}
            </Badge>
            <Badge variant={equipment.status === "active" ? "success" : "outline"}>
              {EQUIPMENT_STATUS_LABELS[equipment.status as EquipmentStatus] ?? equipment.status}
            </Badge>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Fabricante / modelo</p>
          <p className="text-sm font-medium">
            {equipment.manufacturer ?? "—"} {equipment.model ? `/ ${equipment.model}` : ""}
          </p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Nº de série / ANVISA</p>
          <p className="text-sm font-medium">
            {equipment.serial_number ?? "—"} / {equipment.anvisa_registration ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Valor de aquisição</p>
          <p className="text-sm font-medium">{formatCents(equipment.acquisition_value_cents)}</p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Garantia até</p>
          <p className="text-sm font-medium">{formatDate(equipment.warranty_until)}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Dados do equipamento</h2>
        <EquipmentForm categories={categories} equipment={equipment} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Planos de manutenção</h2>
        <div className="space-y-2">
          {equipment.plans.length === 0 ? (
            <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
              Nenhum plano cadastrado.
            </p>
          ) : (
            equipment.plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{plan.description}</p>
                  <p className="text-xs text-muted-foreground">
                    A cada {plan.periodicity_days} dias · última {formatDate(plan.last_done_at)} ·
                    próxima <strong>{formatDate(plan.next_due_date)}</strong>
                  </p>
                </div>
                <form action={deleteMaintenancePlan}>
                  <input type="hidden" name="id" value={plan.id} />
                  <input type="hidden" name="equipment_id" value={equipment.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Remover
                  </Button>
                </form>
              </div>
            ))
          )}
        </div>
        <MaintenancePlanForm equipmentId={equipment.id} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Ordens de serviço</h2>
        <div className="space-y-3">
          {equipment.orders.length === 0 ? (
            <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
              Nenhuma ordem de serviço.
            </p>
          ) : (
            equipment.orders.map((order) => {
              const open = order.status === "open" || order.status === "in_progress";
              return (
                <div key={order.id} className="space-y-3 rounded-xl border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {order.number} · {SERVICE_ORDER_TYPE_LABELS[order.type as ServiceOrderType] ??
                          order.type}
                        <span className="ml-2">
                          <Badge variant={statusVariant(order.status)}>
                            {SERVICE_ORDER_STATUS_LABELS[order.status as ServiceOrderStatus] ??
                              order.status}
                          </Badge>
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aberta {formatDateTime(order.opened_at)}
                        {order.technician ? ` · ${order.technician}` : ""}
                        {order.cost_cents ? ` · ${formatCents(order.cost_cents)}` : ""}
                      </p>
                    </div>
                    <form action={deleteServiceOrder}>
                      <input type="hidden" name="id" value={order.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Excluir
                      </Button>
                    </form>
                  </div>
                  {order.description ? (
                    <p className="text-sm text-muted-foreground">{order.description}</p>
                  ) : null}
                  {order.findings ? (
                    <p className="rounded-md bg-muted p-2 text-sm">{order.findings}</p>
                  ) : null}
                  {open ? (
                    <ServiceOrderCloseForm
                      orderId={order.id}
                      technician={order.technician}
                      costCents={order.cost_cents}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        <ServiceOrderForm equipmentId={equipment.id} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Movimentações</h2>
          <Link
            href="/app/equipment/movements"
            className="text-sm font-medium text-primary hover:underline"
          >
            Gerenciar →
          </Link>
        </div>
        {equipment.loans.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhuma movimentação.
          </p>
        ) : (
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Recolhimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      {loan.sector}
                      {loan.isolation ? " · isolamento" : ""}
                    </TableCell>
                    <TableCell>{formatDateTime(loan.delivered_at)}</TableCell>
                    <TableCell>
                      {loan.returned_at ? formatDateTime(loan.returned_at) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={loan.status === "loaned" ? "secondary" : "outline"}>
                        {loan.status === "loaned" ? "Em posse do setor" : "Recolhido"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Contratos</h2>
        {equipment.contracts.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhum contrato.
          </p>
        ) : (
          equipment.contracts.map((contract) => (
            <div
              key={contract.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {EQUIPMENT_CONTRACT_TYPE_LABELS[contract.type as EquipmentContractType] ??
                    contract.type}
                  {contract.provider ? ` · ${contract.provider}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(contract.start_date)} → {formatDate(contract.end_date)} ·{" "}
                  {formatCents(contract.value_cents)}
                </p>
              </div>
              <form action={deleteContract}>
                <input type="hidden" name="id" value={contract.id} />
                <input type="hidden" name="equipment_id" value={equipment.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Remover
                </Button>
              </form>
            </div>
          ))
        )}
        <ContractForm equipmentId={equipment.id} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Tecnovigilância</h2>
        {equipment.incidents.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhum evento registrado.
          </p>
        ) : (
          equipment.incidents.map((incident) => (
            <div key={incident.id} className="space-y-1 rounded-xl border bg-background p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  Gravidade{" "}
                  {INCIDENT_SEVERITY_LABELS[incident.severity as IncidentSeverity] ??
                    incident.severity}{" "}
                  · {formatDate(incident.occurred_at)}
                </p>
                <form action={deleteIncident}>
                  <input type="hidden" name="id" value={incident.id} />
                  <input type="hidden" name="equipment_id" value={equipment.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Excluir
                  </Button>
                </form>
              </div>
              <p className="text-muted-foreground">{incident.description}</p>
              {incident.anvisa_notified ? (
                <Badge variant="warning">
                  Notificado ANVISA
                  {incident.notification_number ? ` · ${incident.notification_number}` : ""}
                </Badge>
              ) : null}
            </div>
          ))
        )}
        <IncidentForm equipmentId={equipment.id} />
      </section>
    </div>
  );
}
