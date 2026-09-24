import { Button } from "@/components/ui/button";
import { MODULES, type ModuleCategory } from "@/modules/core/catalog";
import { updateTenantModules } from "@/modules/tenants/actions";

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  core: "Núcleo",
  clinical: "Clínico",
  diagnostic: "Diagnóstico",
  pharmacy: "Farmácia / Estoque",
  hospital: "Hospitalar",
  financial: "Financeiro",
  communication: "Comunicação",
  growth: "Crescimento",
  platform: "Plataforma / IA",
};

export function TenantModulesForm({
  tenantId,
  selected,
}: {
  tenantId: string;
  selected: string[];
}) {
  const groups = Object.entries(CATEGORY_LABELS).map(([category, label]) => ({
    category: category as ModuleCategory,
    label,
    modules: MODULES.filter((m) => m.category === category),
  }));

  return (
    <form action={updateTenantModules} className="space-y-6 rounded-xl border bg-background p-4">
      <input type="hidden" name="tenant_id" value={tenantId} />

      {groups.map((group) => (
        <div key={group.category} className="space-y-2">
          <h3 className="text-sm font-semibold">{group.label}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.modules.map((module) => (
              <label key={module.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="modules"
                  value={module.key}
                  defaultChecked={selected.includes(module.key)}
                  className="size-4 rounded border"
                />
                {module.label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <Button type="submit">Salvar módulos</Button>
    </form>
  );
}
