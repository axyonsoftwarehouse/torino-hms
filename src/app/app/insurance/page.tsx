import { InsuranceForm } from "@/components/insurance-form";
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
import { deleteInsuranceCompany } from "@/modules/insurance/actions";
import { listInsuranceCompanies } from "@/modules/insurance/queries";

export const dynamic = "force-dynamic";

export default async function InsurancePage() {
  const session = await requireSession();
  const companies = await listInsuranceCompanies(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Convênios</h1>
        <p className="text-sm text-muted-foreground">
          {companies.length} convênio(s) cadastrado(s).
        </p>
      </div>

      <InsuranceForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>ANS</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum convênio cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.ans_code ?? "—"}</TableCell>
                  <TableCell>{company.contact_person ?? "—"}</TableCell>
                  <TableCell>{company.phone ?? "—"}</TableCell>
                  <TableCell>{company.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteInsuranceCompany}>
                      <input type="hidden" name="id" value={company.id} />
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
