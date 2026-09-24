import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { DischargeForm } from "@/components/discharge-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { getAssignment } from "@/modules/beds/queries";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const assignment = await getAssignment(id);
  if (!assignment) notFound();

  const active = assignment.status === "active";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/beds" className="text-sm text-muted-foreground hover:underline">
          ← Leitos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {assignment.patient_name ?? "Internação"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Leito {assignment.bed_number ?? "—"}
          {assignment.category_name ? ` · ${assignment.category_name}` : ""}
          {assignment.professional_name ? ` · ${assignment.professional_name}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Internado" : "Alta"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Admissão: {formatDateTime(assignment.admitted_at)}
          {assignment.discharged_at
            ? ` · Alta: ${formatDateTime(assignment.discharged_at)}`
            : ""}
        </span>
      </div>

      {assignment.diagnosis || assignment.notes ? (
        <div className="rounded-xl border bg-background p-4 text-sm">
          {assignment.diagnosis ? (
            <p>
              <span className="text-muted-foreground">Hipótese diagnóstica: </span>
              {assignment.diagnosis}
            </p>
          ) : null}
          {assignment.notes ? (
            <p className="mt-1">
              <span className="text-muted-foreground">Observações: </span>
              {assignment.notes}
            </p>
          ) : null}
        </div>
      ) : null}

      {active ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Dar alta</h2>
          <DischargeForm assignmentId={assignment.id} />
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Altas registradas</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Diagnóstico final</TableHead>
                  <TableHead>Sumário</TableHead>
                  <TableHead>Instruções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.discharges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                      Sem registro de alta detalhado.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignment.discharges.map((discharge) => (
                    <TableRow key={discharge.id}>
                      <TableCell>{formatDateTime(discharge.discharged_at)}</TableCell>
                      <TableCell>{discharge.final_diagnosis ?? "—"}</TableCell>
                      <TableCell>{discharge.summary ?? "—"}</TableCell>
                      <TableCell>{discharge.instructions ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
