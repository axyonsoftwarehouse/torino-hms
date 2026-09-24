import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import {
  getEnabledModules,
  getPathname,
  requiredModuleForPath,
} from "@/modules/core/access";
import { requireSession } from "@/modules/core/session";
import { exitTenant } from "@/modules/tenants/actions";
import { listTenants } from "@/modules/tenants/queries";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const pathname = await getPathname();
  const isPlatform = session.isSuperadmin && !session.activeTenantId;

  let enabledModules: string[] | null = null;

  if (isPlatform) {
    // Modo Plataforma: acesso restrito ao painel, tenants e billing.
    const allowed =
      pathname === "/app" ||
      pathname.startsWith("/app/tenants") ||
      pathname.startsWith("/app/billing");
    if (!allowed) redirect("/app");
  } else {
    enabledModules = await getEnabledModules(session.activeTenantId);
    const requiredModule = requiredModuleForPath(pathname);
    if (requiredModule && enabledModules && !enabledModules.includes(requiredModule)) {
      redirect("/app");
    }
  }

  let activeTenantName: string | null = null;
  if (session.isSuperadmin && session.activeTenantId) {
    const tenants = await listTenants();
    activeTenantName =
      tenants.find((tenant) => tenant.id === session.activeTenantId)?.name ?? null;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        isSuperadmin={session.isSuperadmin}
        isPlatform={isPlatform}
        enabledModules={enabledModules}
      />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        {session.isSuperadmin && session.activeTenantId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary px-4 py-2 text-sm text-primary-foreground">
            <span>
              Você está operando como{" "}
              <strong>{activeTenantName ?? "tenant selecionado"}</strong> (modo
              superadmin).
            </span>
            <form action={exitTenant}>
              <button
                type="submit"
                className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:opacity-90"
              >
                Sair do tenant
              </button>
            </form>
          </div>
        ) : null}
        <main className="flex-1 bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
