import Link from "next/link";
import { notFound } from "next/navigation";

import { TicketMessageForm } from "@/components/ticket-message-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { setTicketAssignee, setTicketStatus } from "@/modules/support/actions";
import { getTicket } from "@/modules/support/queries";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from "@/modules/support/schema";
import { listTeamMembers } from "@/modules/team/queries";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "resolved") return "success" as const;
  if (status === "closed") return "outline" as const;
  if (status === "pending") return "warning" as const;
  if (status === "in_progress") return "secondary" as const;
  return "default" as const;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const members = await listTeamMembers(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/tickets" className="text-sm text-muted-foreground hover:underline">
          ← Help Desk
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {ticket.number}
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {ticket.subject}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ticket.requester_name ?? "—"}
            {ticket.department_name ? ` · ${ticket.department_name}` : ""}
            {` · ${formatDateTime(ticket.created_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ticket.priority === "urgent" ? "destructive" : "warning"}>
            {TICKET_PRIORITY_LABELS[ticket.priority as TicketPriority] ?? ticket.priority}
          </Badge>
          <Badge variant={statusVariant(ticket.status)}>
            {TICKET_STATUS_LABELS[ticket.status as TicketStatus] ?? ticket.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form action={setTicketStatus} className="flex items-end gap-2 rounded-xl border bg-background p-4">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <div className="flex-1 space-y-2">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              name="status"
              defaultValue={ticket.status}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            >
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TICKET_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline" size="sm">
            Salvar
          </Button>
        </form>

        <form action={setTicketAssignee} className="flex items-end gap-2 rounded-xl border bg-background p-4">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <div className="flex-1 space-y-2">
            <label className="text-xs text-muted-foreground">Responsável</label>
            <select
              name="assignee_id"
              defaultValue={ticket.assignee_id ?? ""}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="">—</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name ?? member.email}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline" size="sm">
            Atribuir
          </Button>
        </form>
      </div>

      {ticket.description ? (
        <div className="rounded-xl border bg-background p-4 text-sm whitespace-pre-wrap">
          {ticket.description}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Conversa</h2>
        <div className="space-y-3">
          {ticket.messages.length === 0 ? (
            <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
              Nenhuma mensagem ainda.
            </p>
          ) : (
            ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl border p-4 text-sm ${
                  message.is_internal
                    ? "border-warning/40 bg-warning/10"
                    : "bg-background"
                }`}
              >
                <p className="mb-1 text-xs text-muted-foreground">
                  {message.author_name ?? "—"} · {formatDateTime(message.created_at)}
                  {message.is_internal ? " · nota interna" : ""}
                </p>
                <p className="whitespace-pre-wrap">{message.body}</p>
              </div>
            ))
          )}
        </div>
        <TicketMessageForm ticketId={ticket.id} />
      </section>
    </div>
  );
}
