import { createClient } from "@/lib/supabase/server";

export type ExpenseItem = {
  id: string;
  description: string;
  amount_cents: number;
  spent_at: string;
  method: string | null;
  category_id: string | null;
  category_name: string | null;
};

export type ExpenseCategoryItem = {
  id: string;
  name: string;
};

type Named = { name: string };
type ExpenseRow = Omit<ExpenseItem, "category_name"> & {
  category: Named | Named[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listExpenses(tenantId: string | null): Promise<ExpenseItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, description, amount_cents, spent_at, method, category_id, category:expense_categories(name)")
    .eq("tenant_id", tenantId)
    .order("spent_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as ExpenseRow;
    return {
      id: r.id,
      description: r.description,
      amount_cents: r.amount_cents,
      spent_at: r.spent_at,
      method: r.method,
      category_id: r.category_id,
      category_name: first(r.category)?.name ?? null,
    };
  });
}

export async function listExpenseCategories(
  tenantId: string | null,
): Promise<ExpenseCategoryItem[]> {
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as ExpenseCategoryItem[];
}
