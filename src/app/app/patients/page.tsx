import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { PatientForm } from "@/components/patient-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { listInsuranceCompanies } from "@/modules/insurance/queries";
import { deletePatient } from "@/modules/patients/actions";
import { searchPatients } from "@/modules/patients/queries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const [{ items, total }, companies] = await Promise.all([
    searchPatients(session.activeTenantId, { q, page, pageSize: PAGE_SIZE }),
    listInsuranceCompanies(session.activeTenantId),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const linkFor = (targetPage: number) =>
    `/app/patients?${new URLSearchParams({
      ...(q ? { q } : {}),
      page: String(targetPage),
    }).toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description={`${total} paciente(s) cadastrado(s).`}
      />

      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome..."
          className="h-9 w-full max-w-xs rounded-full bg-muted/50"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
        {q ? (
          <Link
            href="/app/patients"
            className="text-sm text-muted-foreground hover:underline"
          >
            Limpar
          </Link>
        ) : null}
      </form>

      <PatientForm companies={companies} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Nascimento</TableHead>
              <TableHead>Convênio</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/app/patients/${patient.id}`}
                      className="text-primary hover:underline"
                    >
                      {patient.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{patient.document ?? "—"}</TableCell>
                  <TableCell>{patient.phone ?? patient.email ?? "—"}</TableCell>
                  <TableCell>{formatDate(patient.birth_date)}</TableCell>
                  <TableCell>{patient.insurance_name ?? "Particular"}</TableCell>
                  <TableCell className="text-right">
                    <form action={deletePatient}>
                      <input type="hidden" name="id" value={patient.id} />
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

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            Mostrando {from}–{to} de {total}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={linkFor(page - 1)}
                className="rounded-md border px-3 py-1 hover:bg-muted"
              >
                Anterior
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-1 opacity-40">Anterior</span>
            )}
            <span className="rounded-md px-2 py-1">
              {page}/{totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={linkFor(page + 1)}
                className="rounded-md border px-3 py-1 hover:bg-muted"
              >
                Próxima
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-1 opacity-40">Próxima</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
