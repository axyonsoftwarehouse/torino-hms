import Link from "next/link";

import { KbArticleForm } from "@/components/kb-article-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteKbArticle } from "@/modules/knowledge/actions";
import { listKbArticles, listKbCategories } from "@/modules/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  const { q } = await searchParams;
  const search = (q ?? "").trim();

  const [articles, categories] = await Promise.all([
    listKbArticles(session.activeTenantId, { search }),
    listKbCategories(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Suporte"
        title="Base de conhecimento"
        description={`${articles.length} artigo(s).`}
        actions={
          <Link
            href="/app/knowledge/categories"
            className="text-sm font-medium text-primary hover:underline"
          >
            Categorias →
          </Link>
        }
      />

      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Buscar artigo por título..."
          className="h-9 w-full max-w-xs rounded-full bg-muted/50"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
        {search ? (
          <Link href="/app/knowledge" className="text-sm text-muted-foreground hover:underline">
            Limpar
          </Link>
        ) : null}
      </form>

      <KbArticleForm categories={categories} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum artigo.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/app/knowledge/${article.id}`}
                      className="text-primary hover:underline"
                    >
                      {article.title}
                    </Link>
                  </TableCell>
                  <TableCell>{article.category_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={article.published ? "success" : "outline"}>
                      {article.published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>{article.views}</TableCell>
                  <TableCell>{formatDate(article.updated_at)}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Link
                      href={`/app/knowledge/${article.id}`}
                      className="inline-flex h-8 items-center rounded-full px-3 text-sm font-medium hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <form action={deleteKbArticle}>
                      <input type="hidden" name="id" value={article.id} />
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
