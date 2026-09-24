import Link from "next/link";

import { MedicineCategoryForm } from "@/components/medicine-category-form";
import { MedicineForm } from "@/components/medicine-form";
import { PageHeader } from "@/components/page-header";
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
import { formatCents, formatDate } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import {
  deleteMedicine,
  deleteMedicineCategory,
} from "@/modules/pharmacy/actions";
import {
  listExpiringBatches,
  listMedicineCategories,
  listMedicines,
} from "@/modules/pharmacy/queries";

export const dynamic = "force-dynamic";

function stockStatus(stock: number, reorder: number) {
  if (stock <= 0) return { label: "Esgotado", variant: "destructive" as const };
  if (reorder > 0 && stock <= reorder) return { label: "Baixo", variant: "warning" as const };
  return { label: "OK", variant: "success" as const };
}

export default async function PharmacyPage() {
  const session = await requireSession();
  const tenantId = session.activeTenantId;

  const [medicines, categories, expiring] = await Promise.all([
    listMedicines(tenantId),
    listMedicineCategories(tenantId),
    listExpiringBatches(tenantId),
  ]);

  const lowStock = medicines.filter(
    (medicine) =>
      medicine.stock <= 0 ||
      (medicine.reorder_level > 0 && medicine.stock <= medicine.reorder_level),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Farmácia"
        description={`${medicines.length} medicamento(s) · ${lowStock.length} em alerta.`}
        actions={
          <>
            <Link
              href="/app/pharmacy/reports"
              className="text-sm font-medium text-primary hover:underline"
            >
              Relatórios →
            </Link>
            <Link
              href="/app/pharmacy/suppliers"
              className="text-sm font-medium text-primary hover:underline"
            >
              Fornecedores →
            </Link>
          </>
        }
      />

      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            <p className="font-medium">Estoque baixo</p>
            <p className="text-muted-foreground">
              {lowStock.length} medicamento(s) no/abaixo do mínimo.
            </p>
          </div>
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            <p className="font-medium">Vencimento próximo</p>
            <p className="text-muted-foreground">
              {expiring.length} lote(s) vencendo em até 60 dias.
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categorias</h2>
        <MedicineCategoryForm />
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria.</p>
          ) : (
            categories.map((category) => (
              <form key={category.id} action={deleteMedicineCategory}>
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
        <h2 className="text-lg font-semibold">Cadastrar medicamento</h2>
        <MedicineForm categories={categories} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Medicamentos</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Nenhum medicamento cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((medicine) => {
                  const status = stockStatus(medicine.stock, medicine.reorder_level);
                  return (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">
                        {medicine.name}
                        {medicine.generic_name ? (
                          <span className="block text-xs text-muted-foreground">
                            {medicine.generic_name}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{medicine.category_name ?? "—"}</TableCell>
                      <TableCell>{medicine.stock}</TableCell>
                      <TableCell>{medicine.reorder_level}</TableCell>
                      <TableCell>{formatCents(medicine.purchase_price_cents)}</TableCell>
                      <TableCell>{formatCents(medicine.sale_price_cents)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <Link
                          href={`/app/pharmacy/${medicine.id}`}
                          className="inline-flex h-7 items-center rounded-md px-2.5 text-sm font-medium hover:bg-muted"
                        >
                          Abrir
                        </Link>
                        <form action={deleteMedicine}>
                          <input type="hidden" name="id" value={medicine.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Excluir
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {expiring.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Lotes vencendo (60 dias)</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiring.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.medicine_name ?? "—"}</TableCell>
                    <TableCell>{batch.batch_number}</TableCell>
                    <TableCell>{formatDate(batch.expiry_date)}</TableCell>
                    <TableCell className="text-right">{batch.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
