import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/modules/core/session";
import { getEquipmentIndicators } from "@/modules/equipment/queries";

export const dynamic = "force-dynamic";

export default async function EquipmentIndicatorsPage() {
  const session = await requireSession();
  const data = await getEquipmentIndicators(session.activeTenantId, 90);

  const cards = [
    { label: "Disponibilidade estimada", value: `${data.availability.toFixed(1)}%` },
    { label: "MTTR (tempo médio de reparo)", value: `${data.mttrHours.toFixed(1)} h` },
    { label: "Tempo em manutenção corretiva", value: `${data.downtimeHours.toFixed(1)} h` },
    { label: "OS no período", value: `${data.totalOrders} (${data.correctiveOrders} corretivas)` },
    { label: "Equipamentos ativos", value: String(data.equipmentCount) },
    { label: "Eventos de tecnovigilância", value: String(data.incidents) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/equipment" className="text-sm text-muted-foreground hover:underline">
          ← Engenharia Clínica
        </Link>
      </div>

      <PageHeader
        eyebrow="Engenharia Clínica"
        title="Indicadores"
        description={`Últimos ${data.periodDays} dias · disponibilidade, MTTR e tecnovigilância.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="border-transparent shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        A disponibilidade é <strong>estimada</strong> a partir do tempo das ordens corretivas
        concluídas; MTBF/MTTR completos exigem registro de intervalos de parada.
      </p>
    </div>
  );
}
