import Link from "next/link";

import { ExamCategoryForm } from "@/components/exam-category-form";
import { ExamTestForm } from "@/components/exam-test-form";
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
import {
  deleteExamCategory,
  deleteExamTest,
} from "@/modules/diagnostics/actions";
import { listExamCategories, listExamTests } from "@/modules/diagnostics/queries";
import { EXAM_KIND_LABELS, type ExamKind } from "@/modules/diagnostics/schema";

export const dynamic = "force-dynamic";

export default async function ExamCatalogPage() {
  const session = await requireSession();
  const [categories, tests] = await Promise.all([
    listExamCategories(session.activeTenantId),
    listExamTests(session.activeTenantId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/diagnostics"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Exames
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Catálogo de exames
        </h1>
        <p className="text-sm text-muted-foreground">
          Categorias e exames disponíveis para os pedidos.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categorias</h2>
        <ExamCategoryForm />
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria.</p>
          ) : (
            categories.map((category) => (
              <form key={category.id} action={deleteExamCategory}>
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  title="Remover categoria"
                  className="rounded-full border bg-background px-3 py-1 text-sm hover:bg-muted"
                >
                  {EXAM_KIND_LABELS[category.kind as ExamKind] ?? category.kind} ·{" "}
                  {category.name} ✕
                </button>
              </form>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cadastrar exame</h2>
        <ExamTestForm categories={categories} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Exames</h2>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum exame cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell>{test.category_name ?? "—"}</TableCell>
                    <TableCell>{formatCents(test.price_cents)}</TableCell>
                    <TableCell>
                      {test.duration_minutes != null ? `${test.duration_minutes} min` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteExamTest}>
                        <input type="hidden" name="id" value={test.id} />
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
      </section>
    </div>
  );
}
