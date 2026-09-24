import Link from "next/link";

import { AcceptInviteForm } from "@/components/accept-invite-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/modules/core/session";
import { TEAM_ROLE_LABELS, type TeamRole } from "@/modules/team/schema";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InviteInfo = {
  email: string;
  role: string;
  tenant_name: string;
  status: string;
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("invite_by_token", { p_token: token });
  const invite = (Array.isArray(data) ? data[0] : data) as InviteInfo | undefined;
  const session = await getSession();

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convite para Torino HMS</CardTitle>
          <CardDescription>
            {invite
              ? `Você foi convidado(a) para ${invite.tenant_name}.`
              : "Convite não encontrado ou expirado."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite ? (
            <>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">E-mail: </span>
                  {invite.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Papel: </span>
                  {TEAM_ROLE_LABELS[invite.role as TeamRole] ?? invite.role}
                </p>
              </div>

              {invite.status !== "pending" ? (
                <p className="text-sm text-muted-foreground">
                  Este convite já foi utilizado.
                </p>
              ) : session ? (
                <AcceptInviteForm token={token} />
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Para aceitar, entre na sua conta ou crie uma.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/login?redirect=/invite/${token}`}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      Entrar
                    </Link>
                    <Link
                      href={`/signup?redirect=/invite/${token}`}
                      className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Criar conta
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Ir para o login →
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
