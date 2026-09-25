import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentForm } from "@/components/document-form";
import { FuelForm } from "@/components/fuel-form";
import { MaintenanceForm } from "@/components/maintenance-form";
import { PageHeader } from "@/components/page-header";
import { VehicleForm } from "@/components/vehicle-form";
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
  deleteDocument,
  deleteFuel,
  deleteMaintenance,
} from "@/modules/fleet/actions";
import { getVehicle, listDriverOptions } from "@/modules/fleet/queries";
import {
  FLEET_MAINTENANCE_TYPE_LABELS,
  FLEET_VEHICLE_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  type FleetMaintenanceType,
  type FleetVehicleStatus,
  type FleetVehicleType,
} from "@/modules/fleet/schema";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const drivers = await listDriverOptions(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/fleet" className="text-sm text-muted-foreground hover:underline">
          ← Frota
        </Link>
      </div>

      <PageHeader
        eyebrow={FLEET_VEHICLE_TYPE_LABELS[vehicle.type as FleetVehicleType] ?? "Veículo"}
        title={vehicle.plate ?? "Veículo"}
        description={[vehicle.brand, vehicle.model, vehicle.model_year]
          .filter(Boolean)
          .join(" ")}
        actions={
          <Badge
            variant={
              vehicle.status === "available"
                ? "success"
                : vehicle.status === "maintenance"
                  ? "warning"
                  : "secondary"
            }
          >
            {FLEET_VEHICLE_STATUS_LABELS[vehicle.status as FleetVehicleStatus] ?? vehicle.status}
          </Badge>
        }
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Dados do veículo</h2>
        <VehicleForm vehicle={vehicle} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Manutenção</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Próxima</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.maintenance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                    Nenhuma manutenção.
                  </TableCell>
                </TableRow>
              ) : (
                vehicle.maintenance.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDate(m.service_date)}</TableCell>
                    <TableCell>
                      {FLEET_MAINTENANCE_TYPE_LABELS[m.type as FleetMaintenanceType] ?? m.type}
                    </TableCell>
                    <TableCell>{m.description ?? "—"}</TableCell>
                    <TableCell>{formatCents(m.cost_cents)}</TableCell>
                    <TableCell>{formatDate(m.next_due_date)}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteMaintenance}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="vehicle_id" value={vehicle.id} />
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
        <MaintenanceForm vehicleId={vehicle.id} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Combustível</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Litros</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Posto</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.fuel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                    Nenhum abastecimento.
                  </TableCell>
                </TableRow>
              ) : (
                vehicle.fuel.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{formatDate(f.fueled_at)}</TableCell>
                    <TableCell>{f.liters}</TableCell>
                    <TableCell>{formatCents(f.total_cents)}</TableCell>
                    <TableCell>{f.station ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteFuel}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="vehicle_id" value={vehicle.id} />
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
        <FuelForm vehicleId={vehicle.id} drivers={drivers} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Documentos</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Nenhum documento.
                  </TableCell>
                </TableRow>
              ) : (
                vehicle.documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.doc_type}</TableCell>
                    <TableCell>{d.number ?? "—"}</TableCell>
                    <TableCell>{formatDate(d.expires_at)}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteDocument}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="vehicle_id" value={vehicle.id} />
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
        <DocumentForm vehicleId={vehicle.id} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Viagens recentes</h2>
          <Link href="/app/fleet/trips" className="text-sm font-medium text-primary hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Trajeto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Nenhuma viagem.
                  </TableCell>
                </TableRow>
              ) : (
                vehicle.trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDateTime(t.scheduled_at)}</TableCell>
                    <TableCell>{t.trip_type}</TableCell>
                    <TableCell>{t.patient_name ?? "—"}</TableCell>
                    <TableCell>
                      {t.origin ?? "—"} → {t.destination ?? "—"}
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
