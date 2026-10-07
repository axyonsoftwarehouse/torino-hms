import { PageHeader } from "@/components/page-header";
import { TenantSettingsForm } from "@/components/tenant-settings-form";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/modules/core/session";
import { getTenant } from "@/modules/tenants/queries";

export const dynamic = "force-dynamic";

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await requireSession();

  if (!session.activeTenantId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações" description="Dados do tenant, pacote e módulos." />
        <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          Selecione um tenant para ver as configurações.
        </p>
      </div>
    );
  }

  const result = await getTenant(session.activeTenantId);
  if (!result) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações" description="Dados do tenant, pacote e módulos." />
        <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          Tenant não encontrado.
        </p>
      </div>
    );
  }

  const { tenant, modules } = result;
  const canEdit = session.isSuperadmin || session.profile?.role === "tenant_admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Dados cadastrais, pacote contratado e módulos habilitados."
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Dados cadastrais</h2>
        {canEdit ? (
          <TenantSettingsForm
            defaultValues={{
              name: tenant.name,
              email: tenant.email ?? "",
              phone: tenant.phone ?? "",
              document: tenant.document ?? "",
              address: tenant.address ?? "",
            }}
          />
        ) : (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Você não tem permissão para editar. Fale com o administrador do tenant.
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Pacote" value={tenant.package_key} />
        <InfoCard
          label="Limite de pacientes"
          value={tenant.patient_limit == null ? "Ilimitado" : String(tenant.patient_limit)}
        />
        <InfoCard
          label="Limite de profissionais"
          value={
            tenant.professional_limit == null ? "Ilimitado" : String(tenant.professional_limit)
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Módulos habilitados</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum módulo habilitado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {modules.map((module) => (
              <Badge key={module} variant="secondary">
                {module}
              </Badge>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
