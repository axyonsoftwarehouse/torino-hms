import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { VehicleForm } from "@/components/vehicle-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/modules/core/session";
import { deleteVehicle } from "@/modules/fleet/actions";
import { listVehicles } from "@/modules/fleet/queries";
import {
  FLEET_VEHICLE_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  type FleetVehicleStatus,
  type FleetVehicleType,
} from "@/modules/fleet/schema";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "available") return "success" as const;
  if (status === "maintenance") return "warning" as const;
  if (status === "in_use") return "secondary" as const;
  return "outline" as const;
}

export default async function FleetPage() {
  const session = await requireSession();
  const vehicles = await listVehicles(session.activeTenantId);

  const stats = [
    { label: "Veículos", value: vehicles.length },
    { label: "Disponíveis", value: vehicles.filter((v) => v.status === "available").length },
    { label: "Em uso", value: vehicles.filter((v) => v.status === "in_use").length },
    { label: "Em manutenção", value: vehicles.filter((v) => v.status === "maintenance").length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hospitalar"
        title="Frota / Ambulância"
        description="Veículos, viagens, manutenção, combustível e documentos."
        actions={
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/app/fleet/trips" className="text-primary hover:underline">
              Viagens →
            </Link>
            <Link href="/app/fleet/drivers" className="text-primary hover:underline">
              Motoristas →
            </Link>
            <Link href="/app/fleet/reports" className="text-primary hover:underline">
              Relatórios →
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-transparent shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <VehicleForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Marca / Modelo</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Odômetro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum veículo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    <Link href={`/app/fleet/${vehicle.id}`} className="text-primary hover:underline">
                      {vehicle.plate ?? "sem placa"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {FLEET_VEHICLE_TYPE_LABELS[vehicle.type as FleetVehicleType] ?? vehicle.type}
                  </TableCell>
                  <TableCell>
                    {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell>{vehicle.location ?? "—"}</TableCell>
                  <TableCell>{vehicle.odometer_km} km</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(vehicle.status)}>
                      {FLEET_VEHICLE_STATUS_LABELS[vehicle.status as FleetVehicleStatus] ??
                        vehicle.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Link
                      href={`/app/fleet/${vehicle.id}`}
                      className="inline-flex h-8 items-center rounded-full px-3 text-sm font-medium hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <form action={deleteVehicle}>
                      <input type="hidden" name="id" value={vehicle.id} />
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
