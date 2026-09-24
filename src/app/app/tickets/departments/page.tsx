import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { TicketDepartmentForm } from "@/components/ticket-department-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/modules/core/session";
import { deleteDepartment } from "@/modules/support/actions";
import { listDepartments } from "@/modules/support/queries";

export const dynamic = "force-dynamic";

export default async function TicketDepartmentsPage() {
  const session = await requireSession();
  const departments = await listDepartments(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/tickets" className="text-sm text-muted-foreground hover:underline">
          ← Help Desk
        </Link>
      </div>
      <PageHeader
        eyebrow="Suporte"
        title="Departamentos de atendimento"
        description={`${departments.length} departamento(s).`}
      />

      <TicketDepartmentForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhum departamento.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteDepartment}>
                      <input type="hidden" name="id" value={department.id} />
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
