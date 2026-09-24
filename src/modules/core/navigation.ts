import {
  ArrowLeftRight,
  BedDouble,
  BookOpen,
  Boxes,
  Building,
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  Microscope,
  Package,
  Pill,
  Receipt,
  Repeat,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Ticket,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { ModuleKey } from "@/modules/core/catalog";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  module?: ModuleKey;
  adminOnly?: boolean;
  platform?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Painel", href: "/app", icon: LayoutDashboard },
  { label: "Pacientes", href: "/app/patients", icon: Users, module: "patient" },
  { label: "Profissionais", href: "/app/doctors", icon: Stethoscope, module: "doctor" },
  { label: "Departamentos", href: "/app/departments", icon: Building, module: "doctor" },
  { label: "Agenda", href: "/app/appointments", icon: Calendar, module: "appointment" },
  { label: "Atendimentos", href: "/app/encounters", icon: ClipboardList, module: "prescription" },
  { label: "Leitos", href: "/app/beds", icon: BedDouble, module: "bed" },
  { label: "Eng. Clínica", href: "/app/equipment", icon: Wrench, module: "equipment" },
  { label: "Movimentações", href: "/app/equipment/movements", icon: ArrowLeftRight, module: "equipment" },
  { label: "Indicadores equi.", href: "/app/equipment/indicators", icon: Gauge, module: "equipment" },
  { label: "Exames", href: "/app/diagnostics", icon: FlaskConical, module: "lab" },
  { label: "Catálogo exames", href: "/app/diagnostics/catalog", icon: Microscope, module: "lab" },
  { label: "Farmácia", href: "/app/pharmacy", icon: Pill, module: "pharmacy" },
  { label: "Compras", href: "/app/purchases", icon: ShoppingCart, module: "pharmacy" },
  { label: "Rel. estoque", href: "/app/pharmacy/reports", icon: Boxes, module: "pharmacy" },
  { label: "Fornecedores", href: "/app/pharmacy/suppliers", icon: Truck, module: "pharmacy" },
  { label: "Financeiro", href: "/app/finance", icon: Wallet, module: "finance" },
  { label: "Serviços", href: "/app/services", icon: Package, module: "finance" },
  { label: "Despesas", href: "/app/expenses", icon: Receipt, module: "finance" },
  { label: "Convênios", href: "/app/insurance", icon: ShieldCheck, module: "insurance" },
  { label: "Relatórios", href: "/app/reports", icon: FileText, module: "report" },
  { label: "Laudos", href: "/app/medical-reports", icon: ScrollText, module: "prescription" },
  { label: "Help Desk", href: "/app/tickets", icon: LifeBuoy },
  { label: "Base de conhecimento", href: "/app/knowledge", icon: BookOpen },
  { label: "Tenants", href: "/app/tenants", icon: Building2, adminOnly: true },
  { label: "Billing", href: "/app/billing", icon: CreditCard, platform: true },
  { label: "Assinaturas", href: "/app/billing/subscriptions", icon: Repeat, platform: true },
  { label: "Faturas SaaS", href: "/app/billing/invoices", icon: FileText, platform: true },
  { label: "Cupons", href: "/app/billing/coupons", icon: Ticket, platform: true },
  { label: "Equipe", href: "/app/team", icon: UserCog },
  { label: "Configurações", href: "/app/settings", icon: Settings },
];
