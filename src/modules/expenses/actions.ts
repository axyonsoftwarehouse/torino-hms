"use server";

import { revalidatePath } from "next/cache";

import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/payment-methods";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import { expenseCategorySchema, expenseSchema } from "./schema";

export type ExpenseActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function createExpense(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const method = PAYMENT_METHODS.includes(v.method as PaymentMethod)
    ? (v.method as PaymentMethod)
    : null;

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    tenant_id: session.activeTenantId,
    category_id: v.category_id,
    description: v.description,
    amount_cents: v.amount_cents ?? 0,
    spent_at: v.spent_at || undefined,
    method,
    created_by: session.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/expenses");
  return { ok: true, message: "Despesa registrada." };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/app/expenses");
}

export async function createExpenseCategory(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) {
    return { ok: false, error: "Nenhum tenant ativo." };
  }

  const parsed = expenseCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/expenses");
  return { ok: true, message: "Categoria criada." };
}

export async function deleteExpenseCategory(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  await supabase.from("expense_categories").delete().eq("id", id);
  revalidatePath("/app/expenses");
}
