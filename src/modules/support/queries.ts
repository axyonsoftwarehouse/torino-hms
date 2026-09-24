import { createClient } from "@/lib/supabase/server";

import type { TicketFilter } from "./schema";

export type DepartmentItem = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
};

export type TicketListItem = {
  id: string;
  number: string;
  subject: string;
  status: string;
  priority: string;
  department_name: string | null;
  requester_name: string | null;
  assignee_name: string | null;
  created_at: string;
};

export type TicketMessage = {
  id: string;
  author_name: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type TicketDetail = TicketListItem & {
  description: string | null;
  department_id: string | null;
  assignee_id: string | null;
  requester_id: string | null;
  due_date: string | null;
  messages: TicketMessage[];
};

type FullName = { full_name: string | null };
type Named = { name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listDepartments(
  tenantId: string | null,
): Promise<DepartmentItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_departments")
    .select("id, name, description, active")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as DepartmentItem[];
}

export async function listTickets(
  tenantId: string | null,
  filter: TicketFilter = "all",
  requesterId?: string,
): Promise<TicketListItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  let query = supabase
    .from("tickets")
    .select(
      "id, number, subject, status, priority, created_at, department:ticket_departments(name), requester:profiles!tickets_requester_id_fkey(full_name), assignee:profiles!tickets_assignee_id_fkey(full_name)",
    )
    .eq("tenant_id", tenantId);

  if (filter !== "all") query = query.eq("status", filter);
  if (requesterId) query = query.eq("requester_id", requesterId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    number: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    department: Named | Named[] | null;
    requester: FullName | FullName[] | null;
    assignee: FullName | FullName[] | null;
  };

  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      number: r.number,
      subject: r.subject,
      status: r.status,
      priority: r.priority,
      department_name: first(r.department)?.name ?? null,
      requester_name: first(r.requester)?.full_name ?? null,
      assignee_name: first(r.assignee)?.full_name ?? null,
      created_at: r.created_at,
    };
  });
}

export async function getTicket(id: string): Promise<TicketDetail | null> {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, number, subject, description, status, priority, department_id, assignee_id, requester_id, due_date, created_at, department:ticket_departments(name), requester:profiles!tickets_requester_id_fkey(full_name), assignee:profiles!tickets_assignee_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!ticket) return null;

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, body, is_internal, created_at, author:profiles(full_name)")
    .eq("ticket_id", id)
    .order("created_at");

  const row = ticket as unknown as {
    id: string;
    number: string;
    subject: string;
    description: string | null;
    status: string;
    priority: string;
    department_id: string | null;
    assignee_id: string | null;
    requester_id: string | null;
    due_date: string | null;
    created_at: string;
    department: Named | Named[] | null;
    requester: FullName | FullName[] | null;
    assignee: FullName | FullName[] | null;
  };

  const messageRows: TicketMessage[] = (messages ?? []).map((m) => {
    const r = m as unknown as {
      id: string;
      body: string;
      is_internal: boolean;
      created_at: string;
      author: FullName | FullName[] | null;
    };
    return {
      id: r.id,
      author_name: first(r.author)?.full_name ?? null,
      body: r.body,
      is_internal: r.is_internal,
      created_at: r.created_at,
    };
  });

  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    department_id: row.department_id,
    assignee_id: row.assignee_id,
    requester_id: row.requester_id,
    due_date: row.due_date,
    created_at: row.created_at,
    department_name: first(row.department)?.name ?? null,
    requester_name: first(row.requester)?.full_name ?? null,
    assignee_name: first(row.assignee)?.full_name ?? null,
    messages: messageRows,
  };
}
