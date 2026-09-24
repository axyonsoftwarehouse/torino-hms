import Link from "next/link";

import { EquipmentForm } from "@/components/equipment-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteEquipment } from "@/modules/equipment/actions";
import { listEquipment, listEquipmentCategories } from "@/modules/equipment/queries";
import {
  EQUIPMENT_CRITICALITY_LABELS,
  EQUIPMENT_STATUS_LABELS,
  type EquipmentCriticality,
  type EquipmentStatus,
} from "@/modules/equipment/schema";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "maintenance") return "warning" as const;
  if (status === "decommissioned") return "destructive" as const;
  return "outline" as const;
}

function criticalityVariant(criticality: string) {
  if (criticality === "high") return "destructive" as const;
  if (criticality === "medium") return "warning" as const;
  return "outline" as const;
}

export default async function EquipmentPage() {
  const session = await requireSession();
  const [equipment, categories] = await Promise.all([
    listEquipment(session.activeTenantId),
    listEquipmentCategories(session.activeTenantId),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const limit = in30.toISOString().slice(0, 10);

  const stats = [
    { label: "Equipamentos", value: equipment.length },
    { label: "Em manutenção", value: equipment.filter((e) => e.status === "maintenance").length },
    { label: "Com OS aberta", value: equipment.filter((e) => e.open_orders > 0).length },
    {
      label: "Manutenção vencendo",
      value: equipment.filter((e) => e.next_due_date && e.next_due_date <= limit).length,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hospitalar"
        title="Engenharia Clínica"
        description="Equipamentos, manutenção e calibração do parque tecnológico."
        actions={
          <Link
            href="/app/equipment/categories"
            className="text-sm font-medium text-primary hover:underline"
          >
            Categorias →
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-transparent shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EquipmentForm categories={categories} />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipamento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Criticidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próx. manutenção</TableHead>
              <TableHead>OS</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhum equipamento cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              equipment.map((item) => {
                const overdue = item.next_due_date && item.next_due_date < today;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Link href={`/app/equipment/${item.id}`} className="text-primary hover:underline">
                        {item.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {item.asset_tag ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>{item.category_name ?? "—"}</TableCell>
                    <TableCell>{item.location ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={criticalityVariant(item.criticality)}>
                        {EQUIPMENT_CRITICALITY_LABELS[item.criticality as EquipmentCriticality] ??
                          item.criticality}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(item.status)}>
                        {EQUIPMENT_STATUS_LABELS[item.status as EquipmentStatus] ?? item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={overdue ? "text-destructive" : ""}>
                      {formatDate(item.next_due_date)}
                    </TableCell>
                    <TableCell>{item.open_orders}</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Link
                        href={`/app/equipment/${item.id}`}
                        className="inline-flex h-8 items-center rounded-full px-3 text-sm font-medium hover:bg-muted"
                      >
                        Abrir
                      </Link>
                      <form action={deleteEquipment}>
                        <input type="hidden" name="id" value={item.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Excluir
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
