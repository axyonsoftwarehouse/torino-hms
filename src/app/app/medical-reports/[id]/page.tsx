import Link from "next/link";
import { notFound } from "next/navigation";

import { MedicalReportEditForm } from "@/components/medical-report-edit-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/modules/core/session";
import { deleteMedicalReport } from "@/modules/medical-reports/actions";
import { getMedicalReport } from "@/modules/medical-reports/queries";
import { listProfessionalOptions } from "@/modules/professionals/queries";

export const dynamic = "force-dynamic";

export default async function MedicalReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const [report, professionals] = await Promise.all([
    getMedicalReport(id),
    listProfessionalOptions(session.activeTenantId),
  ]);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/app/medical-reports"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Laudos clínicos
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {report.title ?? "Laudo"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {report.patient_name ?? "—"}
            {report.professional_name ? ` · ${report.professional_name}` : ""}
          </p>
        </div>
        <form action={deleteMedicalReport}>
          <input type="hidden" name="id" value={report.id} />
          <Button type="submit" variant="outline" size="sm">
            Excluir
          </Button>
        </form>
      </div>

      <MedicalReportEditForm report={report} professionals={professionals} />
    </div>
  );
}
