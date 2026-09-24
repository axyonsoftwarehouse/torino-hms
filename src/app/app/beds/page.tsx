import Link from "next/link";

import { AdmissionForm } from "@/components/admission-form";
import { BedCategoryForm } from "@/components/bed-category-form";
import { BedForm } from "@/components/bed-form";
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
import { requireSession } from "@/modules/core/session";
import {
  deleteBed,
  deleteBedCategory,
  setBedStatus,
} from "@/modules/beds/actions";
import {
  listAssignments,
  listAvailableBeds,
  listBedCategories,
  listBeds,
} from "@/modules/beds/queries";
import { BED_STATUS_LABELS, type BedStatus } from "@/modules/beds/schema";
import { listPatientOptions } from "@/modules/patients/queries";
import { listProfessionalOptions } from "@/modules/professionals/queries";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "available") return "success" as const;
  if (status === "maintenance") return "warning" as const;
  return "secondary" as const;
}

export default async function BedsPage() {
  const session = await requireSession();
  const tenantId = session.activeTenantId;

  const [categories, beds, assignments, availableBeds, patients, professionals] =
    await Promise.all([
      listBedCategories(tenantId),
      listBeds(tenantId),
      listAssignments(tenantId, "active"),
      listAvailableBeds(tenantId),
      listPatientOptions(tenantId),
      listProfessionalOptions(tenantId),
    ]);

  const available = beds.filter((bed) => bed.status === "available").length;
  const occupied = beds.filter((bed) => bed.status === "occupied").length;

  const grouped = categories.map((category) => ({
    category,
    beds: beds.filter((bed) => bed.category_id === category.id),
  }));
  const uncategorized = beds.filter((bed) => !bed.category_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leitos</h1>
        <p className="text-sm text-muted-foreground">
          {beds.length} leito(s) · {available} disponível(is) · {occupied} ocupado(s).
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categorias</h2>
        <BedCategoryForm />
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria.</p>
          ) : (
            categories.map((category) => (
              <form key={category.id} action={deleteBedCategory}>
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  title="Remover categoria"
                  className="rounded-full border bg-background px-3 py-1 text-sm hover:bg-muted"
                >
                  {category.name} ✕
                </button>
              </form>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cadastrar leito</h2>
        <BedForm categories={categories} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mapa de leitos</h2>
        {beds.length === 0 ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhum leito cadastrado.
          </p>
        ) : (
          <div className="space-y-4">
            {[...grouped, { category: { id: "none", name: "Sem categoria" }, beds: uncategorized }]
              .filter((group) => group.beds.length > 0)
              .map((group) => (
                <div key={group.category.id} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {group.category.name}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {group.beds.map((bed) => (
                      <div
                        key={bed.id}
                        className="flex flex-col gap-2 rounded-xl border bg-background p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{bed.number}</span>
                          <Badge variant={statusVariant(bed.status)}>
                            {BED_STATUS_LABELS[bed.status as BedStatus] ?? bed.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCents(bed.daily_rate_cents)}/dia
                        </span>
                        {bed.patient_name ? (
                          <span className="text-sm">{bed.patient_name}</span>
                        ) : null}
                        <div className="flex flex-wrap gap-1">
                          {bed.status !== "occupied" ? (
                            <form action={setBedStatus}>
                              <input type="hidden" name="id" value={bed.id} />
                              <input
                                type="hidden"
                                name="status"
                                value={bed.status === "maintenance" ? "available" : "maintenance"}
                              />
                              <Button type="submit" variant="ghost" size="sm">
                                {bed.status === "maintenance" ? "Ativar" : "Manutenção"}
                              </Button>
                            </form>
                          ) : null}
                          {bed.status === "available" ? (
                            <form action={deleteBed}>
                              <input type="hidden" name="id" value={bed.id} />
                              <Button type="submit" variant="ghost" size="sm">
                                Excluir
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Internar paciente</h2>
        <AdmissionForm
          beds={availableBeds}
          patients={patients}
          professionals={professionals}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Internações ativas</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leito</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Hipótese</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma internação ativa.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.bed_number ?? "—"}
                      {assignment.category_name ? ` · ${assignment.category_name}` : ""}
                    </TableCell>
                    <TableCell>{assignment.patient_name ?? "—"}</TableCell>
                    <TableCell>{assignment.professional_name ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(assignment.admitted_at)}</TableCell>
                    <TableCell>{assignment.diagnosis ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/app/beds/assignments/${assignment.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Dar alta
                      </Link>
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
