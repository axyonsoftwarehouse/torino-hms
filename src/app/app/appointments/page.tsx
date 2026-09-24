import Link from "next/link";

import { AppointmentForm } from "@/components/appointment-form";
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
import { formatCents, formatDateTime } from "@/lib/format";
import { setAppointmentStatus } from "@/modules/appointments/actions";
import {
  listAppointments,
  type AppointmentFilter,
} from "@/modules/appointments/queries";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
} from "@/modules/appointments/schema";
import { requireSession } from "@/modules/core/session";
import { startEncounterFromAppointment } from "@/modules/encounters/actions";
import { listPatientOptions } from "@/modules/patients/queries";
import { listProfessionalOptions } from "@/modules/professionals/queries";

export const dynamic = "force-dynamic";

const FILTERS: { key: AppointmentFilter; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "upcoming", label: "Próximas" },
  { key: "all", label: "Todas" },
];

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "canceled":
      return "destructive" as const;
    case "no_show":
      return "warning" as const;
    case "scheduled":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ when?: string }>;
}) {
  const session = await requireSession();
  const { when } = await searchParams;
  const filter: AppointmentFilter =
    when === "all" || when === "upcoming" ? when : "today";

  const [appointments, patients, professionals] = await Promise.all([
    listAppointments(session.activeTenantId, filter),
    listPatientOptions(session.activeTenantId),
    listProfessionalOptions(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description={`${appointments.length} consulta(s).`}
        actions={
          <div className="flex gap-1 rounded-lg border bg-background p-1">
            {FILTERS.map((item) => (
              <Link
                key={item.key}
                href={`/app/appointments?when=${item.key}`}
                className={`rounded-md px-3 py-1 text-sm ${
                  filter === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        }
      />

      <AppointmentForm patients={patients} professionals={professionals} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-72 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhuma consulta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => {
                const status = appointment.status as AppointmentStatus;
                const canConfirm = status === "scheduled";
                const canClose = status === "scheduled" || status === "confirmed";
                return (
                  <TableRow key={appointment.id}>
                    <TableCell>{formatDateTime(appointment.scheduled_start)}</TableCell>
                    <TableCell className="font-medium">
                      {appointment.patient_name ?? "—"}
                    </TableCell>
                    <TableCell>{appointment.professional_name ?? "—"}</TableCell>
                    <TableCell>{appointment.type ?? "—"}</TableCell>
                    <TableCell>{formatCents(appointment.fee_cents)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(status)}>
                        {APPOINTMENT_STATUS_LABELS[status] ?? status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex flex-wrap justify-end gap-1">
                      {canClose ? (
                        <form action={startEncounterFromAppointment}>
                          <input
                            type="hidden"
                            name="appointment_id"
                            value={appointment.id}
                          />
                          <Button type="submit" size="sm">
                            Atender
                          </Button>
                        </form>
                      ) : null}
                      {canConfirm ? (
                        <StatusButton id={appointment.id} status="confirmed" label="Confirmar" />
                      ) : null}
                      {canClose ? (
                        <>
                          <StatusButton id={appointment.id} status="completed" label="Concluir" />
                          <StatusButton id={appointment.id} status="no_show" label="Faltou" />
                        </>
                      ) : null}
                      {canClose ? (
                        <StatusButton
                          id={appointment.id}
                          status="canceled"
                          label="Cancelar"
                          variant="ghost"
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusButton({
  id,
  status,
  label,
  variant = "outline",
}: {
  id: string;
  status: AppointmentStatus;
  label: string;
  variant?: "outline" | "ghost";
}) {
  return (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={variant} size="sm">
        {label}
      </Button>
    </form>
  );
}
