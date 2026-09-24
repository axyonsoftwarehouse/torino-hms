import Link from "next/link";

import { EncounterForm } from "@/components/encounter-form";
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
import { formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteEncounter } from "@/modules/encounters/actions";
import { listEncounters } from "@/modules/encounters/queries";
import type { EncounterFilter } from "@/modules/encounters/schema";
import { listPatientOptions } from "@/modules/patients/queries";
import { listProfessionalOptions } from "@/modules/professionals/queries";

export const dynamic = "force-dynamic";

const FILTERS: { key: EncounterFilter; label: string }[] = [
  { key: "open", label: "Abertos" },
  { key: "closed", label: "Concluídos" },
  { key: "all", label: "Todos" },
];

export default async function EncountersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: EncounterFilter =
    status === "closed" || status === "all" ? status : "open";

  const [encounters, patients, professionals] = await Promise.all([
    listEncounters(session.activeTenantId, filter),
    listPatientOptions(session.activeTenantId),
    listProfessionalOptions(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Atendimentos</h1>
          <p className="text-sm text-muted-foreground">
            {encounters.length} atendimento(s).
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-background p-1">
          {FILTERS.map((item) => (
            <Link
              key={item.key}
              href={`/app/encounters?status=${item.key}`}
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
      </div>

      <EncounterForm patients={patients} professionals={professionals} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Início</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Queixa</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {encounters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum atendimento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              encounters.map((encounter) => (
                <TableRow key={encounter.id}>
                  <TableCell>{formatDateTime(encounter.started_at)}</TableCell>
                  <TableCell className="font-medium">
                    {encounter.patient_name ?? "—"}
                  </TableCell>
                  <TableCell>{encounter.professional_name ?? "—"}</TableCell>
                  <TableCell>{encounter.chief_complaint ?? "—"}</TableCell>
                  <TableCell>
                    {encounter.diagnosis_code
                      ? `${encounter.diagnosis_code} — `
                      : ""}
                    {encounter.diagnosis ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={encounter.status === "closed" ? "secondary" : "default"}>
                      {encounter.status === "closed" ? "Concluído" : "Aberto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Link
                      href={`/app/encounters/${encounter.id}`}
                      className="inline-flex h-7 items-center rounded-md px-2.5 text-sm font-medium hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <form action={deleteEncounter}>
                      <input type="hidden" name="id" value={encounter.id} />
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
