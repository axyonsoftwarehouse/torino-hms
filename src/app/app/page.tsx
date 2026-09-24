import {
  BedDouble,
  Building2,
  Calendar,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  Package,
  ShoppingCart,
  Stethoscope,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { BarChart, DonutChart, LineChart } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/modules/appointments/schema";
import { requireSession } from "@/modules/core/session";
import { getDashboardData } from "@/modules/reports/dashboard";
import { listTenants } from "@/modules/tenants/queries";

export const dynamic = "force-dynamic";

const ALERT_ICONS: Record<string, typeof Package> = {
  low_stock: Package,
  expiring: CalendarClock,
  exams: FlaskConical,
  encounters: ClipboardList,
  beds: BedDouble,
  invoices: Wallet,
  purchases: ShoppingCart,
  equipment: Wrench,
};

const STATUS_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.isSuperadmin && !session.activeTenantId) {
    const tenants = await listTenants();
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Plataforma"
          title="Painel da plataforma"
          description="Visão geral do SaaS. Escolha um tenant em Tenants para operar o dia a dia."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-transparent shadow-sm">
            <CardContent className="flex items-start gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Tenants</p>
                <p className="text-2xl font-semibold tracking-tight">{tenants.length}</p>
                <p className="text-xs text-muted-foreground">hospitais / clínicas</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Link
          href="/app/tenants"
          className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Gerenciar tenants →
        </Link>
      </div>
    );
  }

  const data = await getDashboardData(session.activeTenantId);
  const { kpis } = data;

  const stats = [
    {
      label: "Pacientes",
      value: kpis.patients,
      icon: Users,
      hint: `${kpis.patientsNewMonth} novo(s) este mês`,
    },
    {
      label: "Profissionais ativos",
      value: kpis.professionalsActive,
      icon: Stethoscope,
      hint: `${kpis.professionalsInactive} inativo(s)`,
    },
    {
      label: "Consultas hoje",
      value: kpis.today,
      icon: Calendar,
      hint: `${kpis.todayCompleted} concluída(s)`,
    },
    {
      label: "Consultas futuras",
      value: kpis.upcoming,
      icon: CalendarClock,
      hint: kpis.nextUpcoming
        ? `Próxima: ${formatDateTime(kpis.nextUpcoming)}`
        : "Nenhuma agendada",
    },
  ];

  const donutData = data.statusBreakdown.map((s, index) => ({
    label: APPOINTMENT_STATUS_LABELS[s.status as AppointmentStatus] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da operação do seu hospital ou clínica.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-transparent shadow-sm">
            <CardContent className="flex items-start gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <stat.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="truncate text-xs text-muted-foreground">{stat.hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Consultas (últimos 7 dias)</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-success" /> Concluídas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" /> Outras
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <BarChart data={data.last7} />
          </CardContent>
        </Card>

        <Card className="border-transparent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Receita × Despesa (6 meses)</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--chart-3)]" /> Receita
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-warning" /> Despesa
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart data={data.months} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-transparent shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Consultas por status (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem consultas no período.
              </p>
            ) : (
              <DonutChart data={donutData} />
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nada pendente. Tudo em dia. 🎉
              </p>
            ) : (
              data.alerts.map((alert) => {
                const Icon = ALERT_ICONS[alert.key] ?? ClipboardList;
                return (
                  <Link
                    key={alert.key}
                    href={alert.href}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1 text-sm">{alert.label}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {alert.count}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
