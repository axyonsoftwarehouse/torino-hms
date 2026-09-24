"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setActiveTenant } from "@/modules/tenants/actions";
import type { TenantOption } from "@/modules/tenants/queries";

export function TenantSwitcher({
  tenants,
  activeTenantId,
}: {
  tenants: TenantOption[];
  activeTenantId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (tenants.length === 0) return null;

  return (
    <select
      value={activeTenantId ?? ""}
      disabled={pending}
      onChange={(event) => {
        const value = event.target.value;
        startTransition(async () => {
          await setActiveTenant(value);
          router.refresh();
        });
      }}
      className="h-8 rounded-md border bg-background px-2 text-sm disabled:opacity-50"
    >
      {tenants.map((tenant) => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name}
        </option>
      ))}
    </select>
  );
}
