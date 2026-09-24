import Link from "next/link";

import { KbCategoryForm } from "@/components/kb-category-form";
import { PageHeader } from "@/components/page-header";
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
import { deleteKbCategory } from "@/modules/knowledge/actions";
import { listKbCategories } from "@/modules/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function KnowledgeCategoriesPage() {
  const session = await requireSession();
  const categories = await listKbCategories(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/knowledge" className="text-sm text-muted-foreground hover:underline">
          ← Base de conhecimento
        </Link>
      </div>
      <PageHeader
        eyebrow="Suporte"
        title="Categorias da base"
        description={`${categories.length} categoria(s).`}
      />

      <KbCategoryForm />

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
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhuma categoria.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteKbCategory}>
                      <input type="hidden" name="id" value={category.id} />
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
