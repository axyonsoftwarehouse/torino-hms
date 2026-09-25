import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { TripForm } from "@/components/trip-form";
import { TripStatusForm } from "@/components/trip-status-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteTrip } from "@/modules/fleet/actions";
import {
  listDriverOptions,
  listTrips,
  listVehicleOptions,
} from "@/modules/fleet/queries";
import {
  FLEET_TRIP_STATUS_LABELS,
  TRIP_FILTERS,
  type FleetTripStatus,
  type TripFilter,
} from "@/modules/fleet/schema";
import { listPatientOptions } from "@/modules/patients/queries";

export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<TripFilter, string> = {
  scheduled: "Agendadas",
  in_progress: "Em andamento",
  completed: "Concluídas",
  canceled: "Canceladas",
  all: "Todas",
};

function statusVariant(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "in_progress") return "warning" as const;
  return "secondary" as const;
}

export default async function FleetTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: TripFilter = TRIP_FILTERS.includes(status as TripFilter)
    ? (status as TripFilter)
    : "all";

  const [trips, vehicles, drivers, patients] = await Promise.all([
    listTrips(session.activeTenantId, filter),
    listVehicleOptions(session.activeTenantId),
    listDriverOptions(session.activeTenantId),
    listPatientOptions(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/fleet" className="text-sm text-muted-foreground hover:underline">
          ← Frota
        </Link>
      </div>
      <PageHeader
        eyebrow="Frota"
        title="Viagens"
        description={`${trips.length} viagem(ns).`}
      />

      <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
        {TRIP_FILTERS.map((item) => (
          <Link
            key={item}
            href={`/app/fleet/trips?status=${item}`}
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

      <TripForm vehicles={vehicles} drivers={drivers} patients={patients} />

      <section className="space-y-3">
        {trips.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhuma viagem.
          </p>
        ) : (
          trips.map((trip) => {
            const active = trip.status === "scheduled" || trip.status === "in_progress";
            return (
              <div key={trip.id} className="space-y-3 rounded-xl border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {trip.vehicle_label ?? "Veículo"} · {trip.trip_type}
                      <span className="ml-2">
                        <Badge variant={statusVariant(trip.status)}>
                          {FLEET_TRIP_STATUS_LABELS[trip.status as FleetTripStatus] ?? trip.status}
                        </Badge>
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trip.patient_name ? `${trip.patient_name} · ` : ""}
                      {trip.driver_name ?? "sem motorista"}
                      {trip.origin || trip.destination
                        ? ` · ${trip.origin ?? "?"} → ${trip.destination ?? "?"}`
                        : ""}
                      {trip.scheduled_at ? ` · ${formatDateTime(trip.scheduled_at)}` : ""}
                    </p>
                  </div>
                  <form action={deleteTrip}>
                    <input type="hidden" name="id" value={trip.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Excluir
                    </Button>
                  </form>
                </div>
                {active ? <TripStatusForm tripId={trip.id} status={trip.status} odometerStart={null} /> : null}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
