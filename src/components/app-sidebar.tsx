"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { cn } from "cn";

import { NAV_ITEMS } from "@/modules/core/navigation";

export function AppSidebar({
  isSuperadmin,
  isPlatform,
  enabledModules,
}: {
  isSuperadmin: boolean;
  isPlatform: boolean;
  enabledModules: string[] | null;
}) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => {
    if (isPlatform) {
      return item.href === "/app" || Boolean(item.adminOnly) || Boolean(item.platform);
    }
    if (item.platform) return false;
    if (item.adminOnly && !isSuperadmin) return false;
    if (item.module && enabledModules && !enabledModules.includes(item.module)) {
      return false;
    }
    return true;
  });

  let activeHref = "";
  for (const item of items) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href.length > activeHref.length) activeHref = item.href;
    }
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Activity className="size-4" />
        </span>
        <span className="font-heading text-sm font-semibold tracking-tight">
          Torino <span className="text-primary">HMS</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
          <p className="font-heading text-sm font-semibold">
            {isPlatform ? "Plataforma" : "Módulos & plano"}
          </p>
          <p className="mt-1 text-xs text-primary-foreground/80">
            {isPlatform
              ? "Gerencie os clientes (tenants) e seus módulos."
              : "Ative os módulos conforme o pacote do tenant."}
          </p>
          <Link
            href={isPlatform ? "/app/tenants" : "/app/settings"}
            className="mt-3 inline-flex rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground"
          >
            {isPlatform ? "Gerenciar tenants" : "Configurações"}
          </Link>
        </div>
      </div>
    </aside>
  );
}
