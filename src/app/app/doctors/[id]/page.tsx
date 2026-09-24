import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfessionalEditForm } from "@/components/professional-edit-form";
import { ScheduleForm } from "@/components/schedule-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime } from "@/lib/format";
import { listDayAppointments } from "@/modules/appointments/queries";
import { requireSession } from "@/modules/core/session";
import { listDepartments } from "@/modules/departments/queries";
import { getProfessional } from "@/modules/professionals/queries";
import { deleteSchedule } from "@/modules/schedules/actions";
import { listSchedules } from "@/modules/schedules/queries";
import { generateSlots, toDateInput, weekdayLabel } from "@/modules/schedules/slots";

export const dynamic = "force-dynamic";

function shortTime(value: string) {
  return value.slice(0, 5);
}

export default async function ProfessionalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { date } = await searchParams;

  const [professional, departments] = await Promise.all([
    getProfessional(id),
    listDepartments(session.activeTenantId),
  ]);
  if (!professional) notFound();

  const dayDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "")
    ? (date as string)
    : toDateInput(new Date());

  const [schedules, dayAppointments] = await Promise.all([
    listSchedules(id),
    listDayAppointments(id, dayDate),
  ]);
  const slots = generateSlots(schedules, dayDate);

  function appointmentFor(slot: { start: string; end: string }) {
    const start = new Date(slot.start).getTime();
    const end = new Date(slot.end).getTime();
    return dayAppointments.find((appointment) => {
      const apptStart = new Date(appointment.scheduled_start).getTime();
      const apptEnd = appointment.scheduled_end
        ? new Date(appointment.scheduled_end).getTime()
        : apptStart + 30 * 60_000;
      return apptStart < end && apptEnd > start;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/doctors" className="text-sm text-muted-foreground hover:underline">
          ← Profissionais
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {professional.full_name}
        </h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dados do profissional</h2>
        <ProfessionalEditForm professional={professional} departments={departments} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Disponibilidade semanal</h2>
          <p className="text-sm text-muted-foreground">
            Blocos de horário recorrentes por dia da semana.
          </p>
        </div>
        <ScheduleForm professionalId={professional.id} />
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    Sem disponibilidade cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="font-medium">
                      {weekdayLabel(block.weekday)}
                    </TableCell>
                    <TableCell>{shortTime(block.start_time)}</TableCell>
                    <TableCell>{shortTime(block.end_time)}</TableCell>
                    <TableCell>{block.slot_minutes} min</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteSchedule}>
                        <input type="hidden" name="id" value={block.id} />
                        <input type="hidden" name="professional_id" value={professional.id} />
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
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Agenda do dia</h2>
          <p className="text-sm text-muted-foreground">
            Slots gerados a partir da disponibilidade semanal.
          </p>
        </div>

        <form method="get" className="flex items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" defaultValue={dayDate} />
          </div>
          <Button type="submit" variant="outline">
            Ver agenda
          </Button>
        </form>

        {slots.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhum slot para esta data (verifique a disponibilidade semanal do dia).
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => {
              const appointment = appointmentFor(slot);
              return (
                <div
                  key={slot.start}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <span>
                    {formatTime(slot.start)} – {formatTime(slot.end)}
                  </span>
                  {appointment ? (
                    <Badge variant="default">{appointment.patient_name ?? "Ocupado"}</Badge>
                  ) : (
                    <Badge variant="outline">Livre</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
