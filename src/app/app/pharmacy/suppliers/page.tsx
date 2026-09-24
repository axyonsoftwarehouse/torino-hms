import Link from "next/link";

import { SupplierForm } from "@/components/supplier-form";
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
import { deleteSupplier } from "@/modules/pharmacy/actions";
import { listSuppliers } from "@/modules/pharmacy/queries";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const session = await requireSession();
  const suppliers = await listSuppliers(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/pharmacy" className="text-sm text-muted-foreground hover:underline">
          ← Farmácia
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Fornecedores</h1>
        <p className="text-sm text-muted-foreground">{suppliers.length} fornecedor(es).</p>
      </div>

      <SupplierForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum fornecedor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.company_name ?? "—"}</TableCell>
                  <TableCell>{supplier.contact_person ?? "—"}</TableCell>
                  <TableCell>{supplier.email ?? "—"}</TableCell>
                  <TableCell>{supplier.phone ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteSupplier}>
                      <input type="hidden" name="id" value={supplier.id} />
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
