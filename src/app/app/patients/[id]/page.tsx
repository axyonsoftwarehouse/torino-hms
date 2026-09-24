import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { listPatientAppointments } from "@/modules/appointments/queries";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/modules/appointments/schema";
import { requireSession } from "@/modules/core/session";
import { listPatientEncounters } from "@/modules/encounters/queries";
import { getPatient } from "@/modules/patients/queries";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "no_show") return "warning" as const;
  return "secondary" as const;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const patient = await getPatient(id);
  if (!patient) notFound();

  const [encounters, appointments] = await Promise.all([
    listPatientEncounters(id),
    listPatientAppointments(id),
  ]);

  const tiles = [
    {
      label: "Contato",
      lines: [patient.phone ?? "—", patient.email ?? "—"],
    },
    {
      label: "Convênio",
      lines: [
        patient.insurance_name ?? "Particular",
        patient.insurance_card_number ? `Carteirinha ${patient.insurance_card_number}` : "—",
      ],
    },
    {
      label: "Dados",
      lines: [
        `Nascimento: ${formatDate(patient.birth_date)}`,
        `Sexo: ${patient.gender ?? "—"} · Sangue: ${patient.blood_type ?? "—"}`,
      ],
    },
    {
      label: "Endereço",
      lines: [patient.address ?? "—", `Documento: ${patient.document ?? "—"}`],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/patients" className="text-sm text-muted-foreground hover:underline">
          ← Pacientes
        </Link>
      </div>

      <PageHeader
        title={patient.full_name}
        description={`Paciente desde ${formatDate(patient.created_at)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-background p-4">
            <p className="text-sm text-muted-foreground">{tile.label}</p>
            {tile.lines.map((line) => (
              <p key={line} className="truncate text-sm font-medium">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      {patient.notes ? (
        <div className="rounded-xl border bg-background p-4 text-sm">
          <span className="text-muted-foreground">Observações: </span>
          {patient.notes}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Atendimentos</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Diagnóstico</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {encounters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Sem atendimentos.
                  </TableCell>
                </TableRow>
              ) : (
                encounters.map((encounter) => (
                  <TableRow key={encounter.id}>
                    <TableCell>{formatDateTime(encounter.started_at)}</TableCell>
                    <TableCell>{encounter.professional_name ?? "—"}</TableCell>
                    <TableCell>
                      {encounter.diagnosis_code ? `${encounter.diagnosis_code} — ` : ""}
                      {encounter.diagnosis ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/app/encounters/${encounter.id}`}
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Consultas</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Sem consultas.
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{formatDateTime(appointment.scheduled_start)}</TableCell>
                    <TableCell>{appointment.professional_name ?? "—"}</TableCell>
                    <TableCell>{appointment.type ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(appointment.status)}>
                        {APPOINTMENT_STATUS_LABELS[appointment.status as AppointmentStatus] ??
                          appointment.status}
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
