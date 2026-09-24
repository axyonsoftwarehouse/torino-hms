import Link from "next/link";
import { notFound } from "next/navigation";

import { KbArticleEditForm } from "@/components/kb-article-edit-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/modules/core/session";
import { deleteKbArticle } from "@/modules/knowledge/actions";
import { getKbArticle, listKbCategories } from "@/modules/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const article = await getKbArticle(id, { incrementView: true });
  if (!article) notFound();

  const categories = await listKbCategories(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/knowledge" className="text-sm text-muted-foreground hover:underline">
          ← Base de conhecimento
        </Link>
      </div>

      <PageHeader
        eyebrow={article.category_name ?? "Artigo"}
        title={article.title}
        description={`/${article.slug} · ${article.views} visualização(ões)`}
        actions={
          <>
            <Badge variant={article.published ? "success" : "outline"}>
              {article.published ? "Publicado" : "Rascunho"}
            </Badge>
            <form action={deleteKbArticle}>
              <input type="hidden" name="id" value={article.id} />
              <Button type="submit" variant="outline" size="sm">
                Excluir
              </Button>
            </form>
          </>
        }
      />

      <KbArticleEditForm article={article} categories={categories} />
    </div>
  );
}
