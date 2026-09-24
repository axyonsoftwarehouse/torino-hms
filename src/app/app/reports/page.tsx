import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payment-methods";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/modules/appointments/schema";
import { requireSession } from "@/modules/core/session";
import { getFinancialReport } from "@/modules/reports/queries";

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const today = toDateInput(new Date());
  const defaultStart = `${today.slice(0, 7)}-01`;
  const start = isDate(params.start) ? params.start : defaultStart;
  const end = isDate(params.end) ? params.end : today;

  const report = await getFinancialReport(session.activeTenantId, { start, end });

  const summary = [
    { label: "Recebido", value: formatCents(report.receivedCents) },
    { label: "Faturado", value: formatCents(report.invoicedCents) },
    { label: "Despesas", value: formatCents(report.expenseCents) },
    { label: "Resultado", value: formatCents(report.resultCents) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Faturamento, despesas, repasses e atendimentos no período.
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
              <div
                className={`text-2xl font-semibold ${
                  item.label === "Resultado" && report.resultCents < 0
                    ? "text-destructive"
                    : ""
                }`}
              >
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recebimentos por forma</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forma</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byMethod.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                      Sem recebimentos.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.byMethod.map((item) => (
                    <TableRow key={item.method}>
                      <TableCell>
                        {PAYMENT_METHOD_LABELS[item.method as PaymentMethod] ?? item.method}
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell className="text-right">{formatCents(item.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Atendimentos por status</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.appointmentsByStatus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                      Sem atendimentos.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.appointmentsByStatus.map((item) => (
                    <TableRow key={item.status}>
                      <TableCell>
                        {APPOINTMENT_STATUS_LABELS[item.status as AppointmentStatus] ??
                          item.status}
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Despesas por categoria</h2>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byExpenseCategory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                      Sem despesas.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.byExpenseCategory.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{formatCents(item.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Repasses por profissional</h2>
          <p className="text-sm text-muted-foreground">
            Consultas concluídas no período.
          </p>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Consultas</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byProfessional.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                      Sem consultas concluídas.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.byProfessional.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.appointments}</TableCell>
                      <TableCell className="text-right">
                        {formatCents(item.revenueCents)}
                      </TableCell>
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
