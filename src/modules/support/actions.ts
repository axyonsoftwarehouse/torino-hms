"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/session";

import {
  ticketAssigneeSchema,
  ticketDepartmentSchema,
  ticketMessageSchema,
  ticketSchema,
  ticketStatusSchema,
} from "./schema";

export type SupportActionState = { ok: boolean; error?: string; message?: string };

export async function createDepartment(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = ticketDepartmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ticket_departments").insert({
    tenant_id: session.activeTenantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/tickets/departments");
  return { ok: true, message: "Departamento criado." };
}

export async function deleteDepartment(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("ticket_departments").delete().eq("id", id);
  revalidatePath("/app/tickets/departments");
}

export async function createTicket(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = ticketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", session.activeTenantId);
  const number = `TKT-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      tenant_id: session.activeTenantId,
      number,
      subject: v.subject,
      description: v.description || null,
      priority: v.priority,
      department_id: v.department_id,
      requester_id: session.userId,
      created_by: session.userId,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/tickets");
  redirect(`/app/tickets/${ticket!.id}`);
}

export async function addTicketMessage(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const session = await requireSession();
  if (!session.activeTenantId) return { ok: false, error: "Nenhum tenant ativo." };

  const parsed = ticketMessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("ticket_messages").insert({
    tenant_id: session.activeTenantId,
    ticket_id: v.ticket_id,
    author_id: session.userId,
    body: v.body,
    is_internal: v.is_internal === "on",
  });
  if (error) return { ok: false, error: error.message };

  const { data: ticket } = await supabase
    .from("tickets")
    .select("status")
    .eq("id", v.ticket_id)
    .maybeSingle();
  if (ticket?.status === "open") {
    await supabase
      .from("tickets")
      .update({ status: "in_progress" })
      .eq("id", v.ticket_id);
  }

  revalidatePath(`/app/tickets/${v.ticket_id}`);
  revalidatePath("/app/tickets");
  return { ok: true, message: "Mensagem enviada." };
}

export async function setTicketStatus(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = ticketStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("tickets")
    .update({
      status: parsed.data.status,
      closed_at:
        parsed.data.status === "closed" || parsed.data.status === "resolved"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", parsed.data.ticket_id);

  revalidatePath(`/app/tickets/${parsed.data.ticket_id}`);
  revalidatePath("/app/tickets");
}

export async function setTicketAssignee(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = ticketAssigneeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("tickets")
    .update({ assignee_id: parsed.data.assignee_id })
    .eq("id", parsed.data.ticket_id);

  revalidatePath(`/app/tickets/${parsed.data.ticket_id}`);
}

export async function deleteTicket(formData: FormData): Promise<void> {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  const supabase = await createClient();
  await supabase.from("tickets").delete().eq("id", id);
  revalidatePath("/app/tickets");
}
