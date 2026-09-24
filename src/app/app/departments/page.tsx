import { DepartmentForm } from "@/components/department-form";
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
import { deleteDepartment } from "@/modules/departments/actions";
import { listDepartments } from "@/modules/departments/queries";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const session = await requireSession();
  const departments = await listDepartments(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Departamentos</h1>
        <p className="text-sm text-muted-foreground">
          {departments.length} departamento(s).
        </p>
      </div>

      <DepartmentForm />

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
                  Nenhum departamento cadastrado.
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
