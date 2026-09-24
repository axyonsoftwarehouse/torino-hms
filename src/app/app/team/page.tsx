import { CopyLinkButton } from "@/components/copy-link-button";
import { InviteForm } from "@/components/invite-form";
import { PageHeader } from "@/components/page-header";
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
import { requireSession } from "@/modules/core/session";
import {
  revokeInvite,
  setMemberActive,
  updateMemberRole,
} from "@/modules/team/actions";
import { listInvites, listTeamMembers } from "@/modules/team/queries";
import { TEAM_ROLES, TEAM_ROLE_LABELS, type TeamRole } from "@/modules/team/schema";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireSession();
  const canManage = session.isSuperadmin || session.profile?.role === "tenant_admin";
  const members = await listTeamMembers(session.activeTenantId);
  const invites = canManage ? await listInvites(session.activeTenantId) : [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description={`${members.length} membro(s) neste tenant.`}
      />

      {!canManage ? (
        <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          Você não tem permissão para gerenciar a equipe. Fale com o administrador do tenant.
        </p>
      ) : null}

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum membro.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const active = member.status !== "inactive";
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name ?? "—"}</TableCell>
                    <TableCell>{member.email ?? "—"}</TableCell>
                    <TableCell>
                      {canManage ? (
                        <form action={updateMemberRole} className="flex items-center gap-2">
                          <input type="hidden" name="profile_id" value={member.id} />
                          <select
                            name="role"
                            defaultValue={member.role}
                            className="h-8 rounded-md border bg-background px-2 text-sm"
                          >
                            {TEAM_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {TEAM_ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" variant="outline" size="sm">
                            Salvar
                          </Button>
                        </form>
                      ) : (
                        TEAM_ROLE_LABELS[member.role as TeamRole] ?? member.role
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={active ? "success" : "destructive"}>
                        {active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <form action={setMemberActive}>
                          <input type="hidden" name="profile_id" value={member.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={active ? "false" : "true"}
                          />
                          <Button type="submit" variant="ghost" size="sm">
                            {active ? "Desativar" : "Ativar"}
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {canManage ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Convidar usuário</h2>
          <InviteForm />
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Link do convite</TableHead>
                  <TableHead className="w-44 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      Nenhum convite pendente.
                    </TableCell>
                  </TableRow>
                ) : (
                  invites.map((invite) => {
                    const link = `${baseUrl}/invite/${invite.token}`;
                    return (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          {TEAM_ROLE_LABELS[invite.role as TeamRole] ?? invite.role}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {link}
                        </TableCell>
                        <TableCell className="flex justify-end gap-1">
                          <CopyLinkButton text={link} />
                          <form action={revokeInvite}>
                            <input type="hidden" name="id" value={invite.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Revogar
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
