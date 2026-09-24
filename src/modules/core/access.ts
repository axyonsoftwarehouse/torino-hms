import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { NAV_ITEMS } from "@/modules/core/navigation";

/** Módulos habilitados para o tenant. Retorna null quando não há tenant ativo. */
export async function getEnabledModules(
  tenantId: string | null,
): Promise<string[] | null> {
  if (!tenantId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_modules")
    .select("module_key, enabled")
    .eq("tenant_id", tenantId);

  if (error) throw error;
  return (data ?? [])
    .filter((row) => row.enabled)
    .map((row) => row.module_key as string);
}

export async function getPathname(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-pathname") ?? "";
}

/** Módulo exigido por uma rota, com base no href mais específico da navegação. */
export function requiredModuleForPath(pathname: string): string | null {
  let match: string | null = null;
  let matchLength = -1;

  for (const item of NAV_ITEMS) {
    if (!item.module) continue;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href.length > matchLength) {
        match = item.module;
        matchLength = item.href.length;
      }
    }
  }

  return match;
}
