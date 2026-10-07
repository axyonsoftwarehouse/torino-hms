import { createClient } from "@/lib/supabase/server";

export type AuditLogItem = {
  id: number;
  created_at: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  actor_name: string | null;
  metadata: Record<string, unknown> | null;
};

export async function listAuditLogs(limit = 100): Promise<AuditLogItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, created_at, action, entity, entity_id, actor:profiles(full_name), metadata",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as number,
    created_at: row.created_at as string,
    action: row.action as string,
    entity: row.entity as string | null,
    entity_id: row.entity_id as string | null,
    actor_name:
      (row.actor as { full_name?: string | null } | null)?.full_name ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  }));
}
