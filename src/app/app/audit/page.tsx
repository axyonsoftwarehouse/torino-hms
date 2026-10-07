import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/modules/core/session";
import { listAuditLogs } from "@/modules/audit/queries";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
};

function actionVariant(action: string): "success" | "default" | "destructive" {
  if (action === "INSERT") return "success";
  if (action === "DELETE") return "destructive";
  return "default";
}

export default async function AuditPage() {
  const session = await requireSession();
  const canView = session.isSuperadmin || session.profile?.role === "tenant_admin";

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title="Auditoria" description="Trilha de auditoria do tenant." />
        <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          Você não tem permissão para ver a auditoria.
        </p>
      </div>
    );
  }

  const logs = await listAuditLogs(100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description={`${logs.length} evento(s) recentes.`}
      />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Autor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum evento registrado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant(log.action)}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.entity ?? "—"}</TableCell>
                  <TableCell className="max-w-[12rem] truncate font-mono text-xs text-muted-foreground">
                    {log.entity_id ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{log.actor_name ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
