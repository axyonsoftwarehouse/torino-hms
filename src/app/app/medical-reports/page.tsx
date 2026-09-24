import Link from "next/link";

import { MedicalReportForm } from "@/components/medical-report-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteMedicalReport } from "@/modules/medical-reports/actions";
import { listMedicalReports } from "@/modules/medical-reports/queries";
import {
  REPORT_FILTERS,
  REPORT_TYPE_LABELS,
  type ReportFilter,
} from "@/modules/medical-reports/schema";
import { listPatientOptions } from "@/modules/patients/queries";
import { listProfessionalOptions } from "@/modules/professionals/queries";

export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<ReportFilter, string> = {
  all: "Todos",
  birth: "Nascimento",
  operation: "Cirurgia",
  death: "Óbito",
  general: "Geral",
};

export default async function MedicalReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireSession();
  const { type } = await searchParams;
  const filter: ReportFilter = REPORT_FILTERS.includes(type as ReportFilter)
    ? (type as ReportFilter)
    : "all";

  const [reports, patients, professionals] = await Promise.all([
    listMedicalReports(session.activeTenantId, filter),
    listPatientOptions(session.activeTenantId),
    listProfessionalOptions(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laudos clínicos</h1>
          <p className="text-sm text-muted-foreground">
            {reports.length} laudo(s).
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
          {REPORT_FILTERS.map((item) => (
            <Link
              key={item}
              href={`/app/medical-reports?type=${item}`}
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
      </div>

      <MedicalReportForm patients={patients} professionals={professionals} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum laudo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{formatDate(report.report_date)}</TableCell>
                  <TableCell>
                    {REPORT_TYPE_LABELS[report.report_type as keyof typeof REPORT_TYPE_LABELS] ??
                      report.report_type}
                  </TableCell>
                  <TableCell className="font-medium">{report.patient_name ?? "—"}</TableCell>
                  <TableCell>{report.professional_name ?? "—"}</TableCell>
                  <TableCell>{report.title ?? "—"}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Link
                      href={`/app/medical-reports/${report.id}`}
                      className="inline-flex h-7 items-center rounded-md px-2.5 text-sm font-medium hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <form action={deleteMedicalReport}>
                      <input type="hidden" name="id" value={report.id} />
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
