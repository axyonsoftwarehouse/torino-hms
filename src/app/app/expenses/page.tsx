import Link from "next/link";

import { ExpenseCategoryForm } from "@/components/expense-category-form";
import { ExpenseForm } from "@/components/expense-form";
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
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payment-methods";
import { requireSession } from "@/modules/core/session";
import {
  deleteExpense,
  deleteExpenseCategory,
} from "@/modules/expenses/actions";
import {
  listExpenseCategories,
  listExpenses,
} from "@/modules/expenses/queries";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await requireSession();
  const [expenses, categories] = await Promise.all([
    listExpenses(session.activeTenantId),
    listExpenseCategories(session.activeTenantId),
  ]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Despesas</h1>
        <p className="text-sm text-muted-foreground">
          {expenses.length} lançamento(s) · total {formatCents(total)}.
        </p>
      </div>

      <ExpenseForm categories={categories} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categorias</h2>
        <ExpenseCategoryForm />
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria.</p>
          ) : (
            categories.map((category) => (
              <form key={category.id} action={deleteExpenseCategory}>
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

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma despesa registrada.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.spent_at)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{expense.category_name ?? "—"}</TableCell>
                  <TableCell>
                    {expense.method
                      ? PAYMENT_METHOD_LABELS[expense.method as PaymentMethod] ??
                        expense.method
                      : "—"}
                  </TableCell>
                  <TableCell>{formatCents(expense.amount_cents)}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={expense.id} />
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

      <p className="text-sm text-muted-foreground">
        <Link href="/app/finance" className="text-primary hover:underline">
          Ir para faturas
        </Link>
      </p>
    </div>
  );
}
