import { z } from "zod";

import { optionalUuid } from "@/lib/validation";

export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "pending",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  pending: "Pendente",
  resolved: "Resolvido",
  closed: "Fechado",
};

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const TICKET_FILTERS = [
  "open",
  "in_progress",
  "pending",
  "resolved",
  "closed",
  "all",
] as const;
export type TicketFilter = (typeof TICKET_FILTERS)[number];

export const ticketDepartmentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  description: z.string().trim().default(""),
});

export const ticketSchema = z.object({
  subject: z.string().trim().min(2, "Informe o assunto"),
  description: z.string().trim().default(""),
  priority: z.enum(TICKET_PRIORITIES),
  department_id: optionalUuid,
});

export const ticketMessageSchema = z.object({
  ticket_id: z.string().trim().min(1, "Ticket inválido"),
  body: z.string().trim().min(2, "Escreva uma mensagem"),
  is_internal: z.string().default(""),
});

export const ticketStatusSchema = z.object({
  ticket_id: z.string().trim().min(1),
  status: z.enum(TICKET_STATUSES),
});

export const ticketAssigneeSchema = z.object({
  ticket_id: z.string().trim().min(1),
  assignee_id: optionalUuid,
});
