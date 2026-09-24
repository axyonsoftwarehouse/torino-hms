"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createKbArticle, type KbActionState } from "@/modules/knowledge/actions";

const INITIAL_STATE: KbActionState = { ok: false };

export function KbArticleForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createKbArticle, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Título *</Label>
        <Input id="title" name="title" required placeholder="Como solicitar manutenção de equipamento" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue=""
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
          <input type="checkbox" name="published" className="size-4 rounded border" />
          Publicar
        </label>
      </div>
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="content">Conteúdo</Label>
        <textarea
          id="content"
          name="content"
          className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Criar artigo"}
        </Button>
        {state.error ? <span className="text-sm text-destructive">{state.error}</span> : null}
      </div>
    </form>
  );
}
