import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getStockReport } from "@/modules/pharmacy/reports";

export const dynamic = "force-dynamic";

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDate(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function StockReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const today = toDateInput(new Date());
  const start = isDate(params.start) ? params.start : `${today.slice(0, 7)}-01`;
  const end = isDate(params.end) ? params.end : today;

  const report = await getStockReport(session.activeTenantId, { start, end });

  const summary = [
    { label: "Estoque (custo)", value: formatCents(report.stockCostCents) },
    { label: "Estoque (venda)", value: formatCents(report.stockSaleCents) },
    { label: "Consumo (custo)", value: formatCents(report.consumptionCostCents) },
    { label: "Compras", value: formatCents(report.purchaseCents) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/pharmacy" className="text-sm text-muted-foreground hover:underline">
          ← Farmácia
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Relatórios de estoque
        </h1>
        <p className="text-sm text-muted-foreground">
          Valoração, consumo, curva ABC e compras no período.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="start">Início</Label>
          <Input id="start" name="start" type="date" defaultValue={start} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">Fim</Label>
          <Input id="end" name="end" type="date" defaultValue={end} />
        </div>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Valoração de estoque</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.valuation.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                      Sem estoque.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.valuation.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right">{formatCents(row.costCents)}</TableCell>
                      <TableCell className="text-right">{formatCents(row.saleCents)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Consumo no período</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.consumption.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                      Sem consumo.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.consumption.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right">{formatCents(row.costCents)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Curva ABC (consumo)</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classe</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Acum.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.abc.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                      Sem dados.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.abc.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-semibold">{row.abcClass}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right">{formatCents(row.costCents)}</TableCell>
                      <TableCell className="text-right">{percent(row.share)}</TableCell>
                      <TableCell className="text-right">{percent(row.cumulative)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Compras por fornecedor</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.purchasesBySupplier.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                      Sem compras recebidas.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.purchasesBySupplier.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{formatCents(row.totalCents)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
