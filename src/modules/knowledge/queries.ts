import { createClient } from "@/lib/supabase/server";

type Named = { name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type KbCategoryItem = {
  id: string;
  name: string;
  description: string | null;
};

export type KbArticleListItem = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  views: number;
  category_name: string | null;
  updated_at: string;
};

export type KbArticleDetail = KbArticleListItem & {
  category_id: string | null;
  content: string | null;
};

export async function listKbCategories(
  tenantId: string | null,
): Promise<KbCategoryItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kb_categories")
    .select("id, name, description")
    .eq("tenant_id", tenantId)
    .order("position")
    .order("name");
  if (error) throw error;
  return (data ?? []) as KbCategoryItem[];
}

export async function listKbArticles(
  tenantId: string | null,
  options: { search?: string; categoryId?: string; publishedOnly?: boolean } = {},
): Promise<KbArticleListItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  let query = supabase
    .from("kb_articles")
    .select("id, title, slug, published, views, updated_at, category:kb_categories(name)")
    .eq("tenant_id", tenantId);

  if (options.publishedOnly) query = query.eq("published", true);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.search) query = query.ilike("title", `%${options.search}%`);

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  type Row = Omit<KbArticleListItem, "category_name"> & {
    category: Named | Named[] | null;
  };
  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      published: r.published,
      views: r.views,
      updated_at: r.updated_at,
      category_name: first(r.category)?.name ?? null,
    };
  });
}

export async function getKbArticle(
  id: string,
  options: { incrementView?: boolean } = {},
): Promise<KbArticleDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kb_articles")
    .select("id, title, slug, content, published, views, category_id, updated_at, category:kb_categories(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  if (options.incrementView) {
    await supabase
      .from("kb_articles")
      .update({ views: (data.views ?? 0) + 1 })
      .eq("id", id);
  }

  const row = data as unknown as {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    published: boolean;
    views: number;
    category_id: string | null;
    updated_at: string;
    category: Named | Named[] | null;
  };

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    published: row.published,
    views: (row.views ?? 0) + (options.incrementView ? 1 : 0),
    category_id: row.category_id,
    updated_at: row.updated_at,
    category_name: first(row.category)?.name ?? null,
  };
}
