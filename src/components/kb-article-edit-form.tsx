"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateKbArticle, type KbActionState } from "@/modules/knowledge/actions";
import type { KbArticleDetail } from "@/modules/knowledge/queries";

const INITIAL_STATE: KbActionState = { ok: false };

export function KbArticleEditForm({
  article,
  categories,
}: {
  article: KbArticleDetail;
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateKbArticle, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="id" value={article.id} />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Título *</Label>
        <Input id="title" name="title" required defaultValue={article.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={article.category_id ?? ""}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="published"
            defaultChecked={article.published}
            className="size-4 rounded border"
          />
          Publicado
        </label>
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="content">Conteúdo</Label>
        <textarea
          id="content"
          name="content"
          defaultValue={article.content ?? ""}
          className="min-h-56 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar artigo"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
        {state.ok && state.message ? (
          <span className="text-sm text-emerald-600">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
