import Link from "next/link";
import { notFound } from "next/navigation";

import { MedicineEditForm } from "@/components/medicine-edit-form";
import { StockInForm } from "@/components/stock-in-form";
import { StockOutForm } from "@/components/stock-out-form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, formatDate, formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { getMedicine, listMedicineCategories, listSuppliers } from "@/modules/pharmacy/queries";
import { MOVEMENT_TYPE_LABELS } from "@/modules/pharmacy/schema";

export const dynamic = "force-dynamic";

export default async function MedicineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const medicine = await getMedicine(id);
  if (!medicine) notFound();

  const [categories, suppliers] = await Promise.all([
    listMedicineCategories(session.activeTenantId),
    listSuppliers(session.activeTenantId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/pharmacy" className="text-sm text-muted-foreground hover:underline">
          ← Farmácia
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{medicine.name}</h1>
          <Badge variant="secondary">{medicine.stock} em estoque</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {medicine.category_name ?? "Sem categoria"}
          {medicine.unit ? ` · ${medicine.unit}` : ""}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dados do medicamento</h2>
        <MedicineEditForm medicine={medicine} categories={categories} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lotes</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Custo unit.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicine.batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Nenhum lote.
                  </TableCell>
                </TableRow>
              ) : (
                medicine.batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_number}</TableCell>
                    <TableCell>{formatDate(batch.expiry_date)}</TableCell>
                    <TableCell className="text-right">{batch.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCents(batch.unit_cost_cents)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Movimentar estoque</h2>
        <StockInForm medicineId={medicine.id} suppliers={suppliers} />
        <StockOutForm medicineId={medicine.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Movimentações</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicine.movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                    Nenhuma movimentação.
                  </TableCell>
                </TableRow>
              ) : (
                medicine.movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateTime(movement.created_at)}</TableCell>
                    <TableCell>
                      {MOVEMENT_TYPE_LABELS[movement.movement_type] ?? movement.movement_type}
                    </TableCell>
                    <TableCell className="text-right">{movement.quantity}</TableCell>
                    <TableCell>{movement.reference ?? "—"}</TableCell>
                    <TableCell>{movement.notes ?? "—"}</TableCell>
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
