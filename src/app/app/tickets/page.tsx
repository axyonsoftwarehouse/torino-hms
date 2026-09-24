import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { TicketForm } from "@/components/ticket-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteTicket } from "@/modules/support/actions";
import { listDepartments, listTickets } from "@/modules/support/queries";
import {
  TICKET_FILTERS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketFilter,
  type TicketPriority,
  type TicketStatus,
} from "@/modules/support/schema";

export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<TicketFilter, string> = {
  open: "Abertos",
  in_progress: "Em andamento",
  pending: "Pendentes",
  resolved: "Resolvidos",
  closed: "Fechados",
  all: "Todos",
};

function statusVariant(status: string) {
  if (status === "resolved") return "success" as const;
  if (status === "closed") return "outline" as const;
  if (status === "pending") return "warning" as const;
  if (status === "in_progress") return "secondary" as const;
  return "default" as const;
}

function priorityVariant(priority: string) {
  if (priority === "urgent") return "destructive" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "low") return "outline" as const;
  return "secondary" as const;
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const filter: TicketFilter = TICKET_FILTERS.includes(status as TicketFilter)
    ? (status as TicketFilter)
    : "all";

  const [tickets, departments] = await Promise.all([
    listTickets(session.activeTenantId, filter),
    listDepartments(session.activeTenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Suporte"
        title="Help Desk"
        description={`${tickets.length} chamado(s).`}
        actions={
          <Link
            href="/app/tickets/departments"
            className="text-sm font-medium text-primary hover:underline"
          >
            Departamentos →
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
        {TICKET_FILTERS.map((item) => (
          <Link
            key={item}
            href={`/app/tickets?status=${item}`}
            className={`rounded-md px-3 py-1 text-sm ${
              filter === item
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {FILTER_LABELS[item]}
          </Link>
        ))}
      </div>

      <TicketForm departments={departments} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum chamado.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.number}</TableCell>
                  <TableCell>
                    <Link
                      href={`/app/tickets/${ticket.id}`}
                      className="text-primary hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {ticket.requester_name ?? "—"} · {formatDateTime(ticket.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>{ticket.department_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant(ticket.priority)}>
                      {TICKET_PRIORITY_LABELS[ticket.priority as TicketPriority] ??
                        ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(ticket.status)}>
                      {TICKET_STATUS_LABELS[ticket.status as TicketStatus] ?? ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.assignee_name ?? "—"}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Link
                      href={`/app/tickets/${ticket.id}`}
                      className="inline-flex h-8 items-center rounded-full px-3 text-sm font-medium hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <form action={deleteTicket}>
                      <input type="hidden" name="id" value={ticket.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Excluir
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
