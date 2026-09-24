import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TenantEditForm } from "@/components/tenant-edit-form";
import { TenantModulesForm } from "@/components/tenant-modules-form";
import { requireSession } from "@/modules/core/session";
import { getTenant } from "@/modules/tenants/queries";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!session.isSuperadmin) redirect("/app");

  const { id } = await params;
  const result = await getTenant(id);
  if (!result) notFound();

  const { tenant, modules } = result;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/tenants" className="text-sm text-muted-foreground hover:underline">
          ← Tenants
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">{tenant.slug}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dados do tenant</h2>
        <TenantEditForm tenant={tenant} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Módulos habilitados</h2>
          <p className="text-sm text-muted-foreground">
            Selecione os módulos que este tenant pode acessar. O pacote acima é apenas
            o ponto de partida.
          </p>
        </div>
        <TenantModulesForm tenantId={tenant.id} selected={modules} />
      </section>
    </div>
  );
}
