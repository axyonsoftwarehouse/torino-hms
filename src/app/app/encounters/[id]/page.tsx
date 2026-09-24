import Link from "next/link";
import { notFound } from "next/navigation";

import { EncounterEditForm } from "@/components/encounter-edit-form";
import { PrescriptionItemForm } from "@/components/prescription-item-form";
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
import {
  closeEncounter,
  reopenEncounter,
} from "@/modules/encounters/actions";
import {
  getEncounter,
  listPatientEncounters,
} from "@/modules/encounters/queries";
import { createInvoiceFromEncounter } from "@/modules/invoices/actions";
import { deletePrescriptionItem } from "@/modules/prescriptions/actions";
import { getEncounterPrescription } from "@/modules/prescriptions/queries";

export const dynamic = "force-dynamic";

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const encounter = await getEncounter(id);
  if (!encounter) notFound();

  const [prescription, history] = await Promise.all([
    getEncounterPrescription(id),
    listPatientEncounters(encounter.patient_id, id),
  ]);

  const closed = encounter.status === "closed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/app/encounters"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Atendimentos
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {encounter.patient_name ?? "Atendimento"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(encounter.started_at)}
            {encounter.professional_name ? ` · ${encounter.professional_name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={closed ? "secondary" : "default"}>
            {closed ? "Concluído" : "Aberto"}
          </Badge>
          <form action={createInvoiceFromEncounter}>
            <input type="hidden" name="encounter_id" value={encounter.id} />
            <Button type="submit" variant="outline" size="sm">
              Gerar fatura
            </Button>
          </form>
          {closed ? (
            <form action={reopenEncounter}>
              <input type="hidden" name="id" value={encounter.id} />
              <Button type="submit" variant="outline" size="sm">
                Reabrir
              </Button>
            </form>
          ) : (
            <form action={closeEncounter}>
              <input type="hidden" name="id" value={encounter.id} />
              <Button type="submit" size="sm">
                Concluir atendimento
              </Button>
            </form>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Prontuário</h2>
        <EncounterEditForm encounter={encounter} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Prescrição</h2>
          <p className="text-sm text-muted-foreground">
            {prescription.items.length} item(ns).
          </p>
        </div>

        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Instruções</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Nenhum item prescrito.
                  </TableCell>
                </TableRow>
              ) : (
                prescription.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.medication}</TableCell>
                    <TableCell>{item.dosage ?? "—"}</TableCell>
                    <TableCell>{item.frequency ?? "—"}</TableCell>
                    <TableCell>{item.duration ?? "—"}</TableCell>
                    <TableCell>{item.instructions ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <form action={deletePrescriptionItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="encounter_id" value={encounter.id} />
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

        <PrescriptionItemForm encounterId={encounter.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico do paciente</h2>
        {history.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Sem atendimentos anteriores para este paciente.
          </p>
        ) : (
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
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDateTime(item.started_at)}</TableCell>
                    <TableCell>{item.professional_name ?? "—"}</TableCell>
                    <TableCell>
                      {item.diagnosis_code ? `${item.diagnosis_code} — ` : ""}
                      {item.diagnosis ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/app/encounters/${item.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Abrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
