import { Bell, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { UserMenu } from "@/components/user-menu";
import { requireSession } from "@/modules/core/session";
import { listTenants } from "@/modules/tenants/queries";

export async function AppHeader() {
  const session = await requireSession();
  const tenants = session.isSuperadmin ? await listTenants() : [];

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b bg-background px-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar paciente, exame, fatura..."
            className="h-9 w-full rounded-full border bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {session.isSuperadmin && session.activeTenantId ? (
          <TenantSwitcher
            tenants={tenants}
            activeTenantId={session.activeTenantId}
          />
        ) : null}
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notificações"
          className="relative inline-flex size-9 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
        </button>
        <UserMenu name={session.profile?.full_name ?? null} email={session.email} />
      </div>
    </header>
  );
}
