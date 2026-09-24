"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { kbArticleSchema, kbCategorySchema, slugify } from "./schema";

export type KbActionState = { ok: boolean; error?: string; message?: string };

export async function createKbCategory(
  _prev: KbActionState,
  formData: FormData,
): Promise<KbActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = kbCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("kb_categories").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/knowledge/categories");
  revalidatePath("/app/knowledge");
  return { ok: true, message: "Categoria criada." };
}

export async function deleteKbCategory(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("kb_categories").delete().eq("id", id);
  revalidatePath("/app/knowledge/categories");
}

export async function createKbArticle(
  _prev: KbActionState,
  formData: FormData,
): Promise<KbActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = kbArticleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const baseSlug = slugify(v.title) || `artigo-${Date.now()}`;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("kb_articles")
    .select("slug")
    .eq("tenant_id", session.activeTenantId)
    .eq("slug", baseSlug)
    .maybeSingle();
  const slug = existing ? `${baseSlug}-${Math.floor(Math.random() * 1000)}` : baseSlug;

  const { data: article, error } = await supabase
    .from("kb_articles")
    .insert({
      tenant_id: session.activeTenantId,
      category_id: v.category_id,
      title: v.title,
      slug,
      content: v.content || null,
      published: v.published === "on",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/knowledge");
  redirect(`/app/knowledge/${article!.id}`);
}

export async function updateKbArticle(
  _prev: KbActionState,
  formData: FormData,
): Promise<KbActionState> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, error: "Artigo inválido." };

  const parsed = kbArticleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("kb_articles")
    .update({
      category_id: v.category_id,
      title: v.title,
      content: v.content || null,
      published: v.published === "on",
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/knowledge");
  revalidatePath(`/app/knowledge/${id}`);
  return { ok: true, message: "Artigo atualizado." };
}

export async function deleteKbArticle(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("kb_articles").delete().eq("id", id);
  revalidatePath("/app/knowledge");
}
