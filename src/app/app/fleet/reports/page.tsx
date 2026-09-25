import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import { getFleetReport } from "@/modules/fleet/queries";
import { FLEET_TRIP_STATUS_LABELS, type FleetTripStatus } from "@/modules/fleet/schema";

export const dynamic = "force-dynamic";

export default async function FleetReportsPage() {
  const session = await requireSession();
  const report = await getFleetReport(session.activeTenantId, 60);
  const totalCost = report.costs.reduce((sum, c) => sum + c.totalCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/fleet" className="text-sm text-muted-foreground hover:underline">
          ← Frota
        </Link>
      </div>
      <PageHeader
        eyebrow="Frota"
        title="Relatórios"
        description="Custos por veículo, viagens e vencimentos (60 dias)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-transparent shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Custo total (frota)</p>
            <p className="text-2xl font-semibold tracking-tight">{formatCents(totalCost)}</p>
          </CardContent>
        </Card>
        <Card className="border-transparent shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Documentos vencendo</p>
            <p className="text-2xl font-semibold tracking-tight">{report.expiringDocs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-transparent shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">CNHs vencendo</p>
            <p className="text-2xl font-semibold tracking-tight">{report.expiringCnh.length}</p>
          </CardContent>
        </Card>
        <Card className="border-transparent shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Viagens</p>
            <p className="text-2xl font-semibold tracking-tight">
              {report.tripCounts.reduce((sum, t) => sum + t.count, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Custos por veículo</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-right">Combustível</TableHead>
                  <TableHead className="text-right">Manutenção</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.costs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                      Sem custos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.costs.map((cost) => (
                    <TableRow key={cost.label}>
                      <TableCell className="font-medium">{cost.label}</TableCell>
                      <TableCell className="text-right">{formatCents(cost.fuelCents)}</TableCell>
                      <TableCell className="text-right">
                        {formatCents(cost.maintenanceCents)}
                      </TableCell>
                      <TableCell className="text-right">{formatCents(cost.totalCents)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Viagens por status</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.tripCounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                      Sem viagens.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.tripCounts.map((t) => (
                    <TableRow key={t.status}>
                      <TableCell>
                        {FLEET_TRIP_STATUS_LABELS[t.status as FleetTripStatus] ?? t.status}
                      </TableCell>
                      <TableCell className="text-right">{t.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Documentos vencendo (60 dias)</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Vence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.expiringDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                      Nada vencendo.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.expiringDocs.map((doc, index) => (
                    <TableRow key={`${doc.vehicle_label}-${index}`}>
                      <TableCell className="font-medium">{doc.vehicle_label}</TableCell>
                      <TableCell>{doc.doc_type}</TableCell>
                      <TableCell className="text-right">{formatDate(doc.expires_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">CNHs vencendo (60 dias)</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="text-right">Vence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.expiringCnh.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                      Nada vencendo.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.expiringCnh.map((cnh) => (
                    <TableRow key={cnh.name}>
                      <TableCell className="font-medium">{cnh.name}</TableCell>
                      <TableCell className="text-right">{formatDate(cnh.expires_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
