import Link from "next/link";
import { redirect } from "next/navigation";

import { TenantForm } from "@/components/tenant-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPackage, type PackageKey } from "@/modules/core/catalog";
import { requireSession } from "@/modules/core/session";
import { enterTenant } from "@/modules/tenants/actions";
import { listTenantsAdmin } from "@/modules/tenants/queries";

export const dynamic = "force-dynamic";

function packageLabel(key: string) {
  return getPackage(key as PackageKey)?.label ?? key;
}

function limitLabel(value: number | null) {
  return value === null ? "∞" : String(value);
}

export default async function TenantsPage() {
  const session = await requireSession();
  if (!session.isSuperadmin) redirect("/app");

  const tenants = await listTenantsAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
        <p className="text-sm text-muted-foreground">
          {tenants.length} hospital(is)/clínica(s) cadastrado(s).
        </p>
      </div>

      <TenantForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Pacote</TableHead>
              <TableHead>Pacientes</TableHead>
              <TableHead>Profissionais</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-44 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum tenant cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell>{packageLabel(tenant.package_key)}</TableCell>
                  <TableCell>{limitLabel(tenant.patient_limit)}</TableCell>
                  <TableCell>{limitLabel(tenant.professional_limit)}</TableCell>
                  <TableCell>{tenant.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <form action={enterTenant}>
                        <input type="hidden" name="tenant_id" value={tenant.id} />
                        <Button type="submit" size="sm">
                          Entrar
                        </Button>
                      </form>
                      <Link
                        href={`/app/tenants/${tenant.id}`}
                        className="inline-flex h-8 items-center rounded-full px-3 text-sm font-medium hover:bg-muted"
                      >
                        Gerenciar
                      </Link>
                    </div>
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
