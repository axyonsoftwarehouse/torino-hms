import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ProfessionalForm } from "@/components/professional-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { listDepartments } from "@/modules/departments/queries";
import {
  deleteProfessional,
  setProfessionalActive,
} from "@/modules/professionals/actions";
import { listProfessionals } from "@/modules/professionals/queries";

export const dynamic = "force-dynamic";

export default async function ProfessionalsPage() {
  const session = await requireSession();
  const [professionals, departments] = await Promise.all([
    listProfessionals(session.activeTenantId),
    listDepartments(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profissionais"
        description={`${professionals.length} profissional(is) neste tenant.`}
      />

      <ProfessionalForm departments={departments} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Consulta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-56 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum profissional cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              professionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-medium">{professional.full_name}</TableCell>
                  <TableCell>{professional.speciality ?? "—"}</TableCell>
                  <TableCell>{professional.department_name ?? "—"}</TableCell>
                  <TableCell>{professional.phone ?? professional.email ?? "—"}</TableCell>
                  <TableCell>{formatCents(professional.fee_cents)}</TableCell>
                  <TableCell>{professional.active ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Link
                      href={`/app/doctors/${professional.id}`}
                      className="inline-flex h-7 items-center rounded-md px-2.5 text-sm font-medium hover:bg-muted"
                    >
                      Editar
                    </Link>
                    <form action={setProfessionalActive}>
                      <input type="hidden" name="id" value={professional.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={professional.active ? "false" : "true"}
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        {professional.active ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    <form action={deleteProfessional}>
                      <input type="hidden" name="id" value={professional.id} />
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
