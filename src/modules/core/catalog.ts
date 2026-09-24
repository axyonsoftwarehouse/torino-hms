/**
 * Catálogo de módulos e pacotes do Torino HMS.
 *
 * Mesmo modelo de negócio do sistema de referência: cada tenant (hospital/clínica)
 * contrata um pacote, que habilita um conjunto de módulos e limites. Módulos "add-on"
 * podem ser habilitados individualmente.
 */

export type ModuleCategory =
  | "core"
  | "clinical"
  | "diagnostic"
  | "pharmacy"
  | "hospital"
  | "financial"
  | "communication"
  | "growth"
  | "platform";

export type ModuleDefinition = {
  key: string;
  label: string;
  category: ModuleCategory;
  description: string;
};

export const MODULES = [
  { key: "patient", label: "Pacientes", category: "core", description: "Cadastro e histórico de pacientes" },
  { key: "doctor", label: "Profissionais", category: "core", description: "Médicos e profissionais de saúde" },
  { key: "appointment", label: "Agenda", category: "core", description: "Agendamento de consultas" },
  { key: "prescription", label: "Prescrições", category: "clinical", description: "Receitas e prescrições" },
  { key: "diagnosis", label: "Diagnósticos", category: "clinical", description: "CID e diagnósticos" },
  { key: "treatment", label: "Tratamentos", category: "clinical", description: "Planos e tratamentos" },
  { key: "dental", label: "Odontologia", category: "clinical", description: "Odontograma e planos odontológicos" },
  { key: "lab", label: "Laboratório", category: "diagnostic", description: "Exames laboratoriais" },
  { key: "radiology", label: "Radiologia", category: "diagnostic", description: "Imagem e laudos" },
  { key: "pharmacy", label: "Farmácia", category: "pharmacy", description: "Dispensação e lotes" },
  { key: "medicine", label: "Medicamentos", category: "pharmacy", description: "Catálogo de medicamentos" },
  { key: "inventory", label: "Estoque", category: "pharmacy", description: "Estoque, compras e fornecedores" },
  { key: "nurse", label: "Enfermagem", category: "hospital", description: "Equipe de enfermagem" },
  { key: "bed", label: "Leitos", category: "hospital", description: "Internação e leitos" },
  { key: "emergency", label: "Emergência", category: "hospital", description: "Pronto atendimento" },
  { key: "ambulance", label: "Ambulância", category: "hospital", description: "Transporte e remoções" },
  { key: "equipment", label: "Engenharia Clínica", category: "hospital", description: "Equipamentos, manutenção e calibração" },
  { key: "insurance", label: "Convênios", category: "financial", description: "Seguradoras e planos" },
  { key: "finance", label: "Financeiro", category: "financial", description: "Faturas, recebimentos e despesas" },
  { key: "accountant", label: "Contabilidade", category: "financial", description: "Rotinas contábeis" },
  { key: "payroll", label: "Folha de pagamento", category: "financial", description: "Salários e pagamentos" },
  { key: "attendance", label: "Ponto", category: "financial", description: "Controle de ponto da equipe" },
  { key: "leave", label: "Férias e licenças", category: "financial", description: "Gestão de férias e ausências" },
  { key: "report", label: "Relatórios", category: "financial", description: "Relatórios gerenciais" },
  { key: "notice", label: "Avisos", category: "communication", description: "Mural de avisos" },
  { key: "email", label: "E-mail", category: "communication", description: "E-mail transacional" },
  { key: "sms", label: "SMS / WhatsApp", category: "communication", description: "Mensageria" },
  { key: "chat", label: "Chat", category: "communication", description: "Conversas internas" },
  { key: "file", label: "Arquivos", category: "growth", description: "Documentos e anexos" },
  { key: "site", label: "Site institucional", category: "growth", description: "Site público do tenant" },
  { key: "ai_image", label: "IA — Imagem", category: "platform", description: "Análise de imagens médicas" },
  { key: "ai_overview", label: "IA — Resumo do paciente", category: "platform", description: "Resumo clínico assistido" },
] as const satisfies readonly ModuleDefinition[];

export type ModuleKey = (typeof MODULES)[number]["key"];

export const MODULE_KEYS = MODULES.map((m) => m.key) as ModuleKey[];

export type PackageDefinition = {
  key: string;
  label: string;
  description: string;
  modules: ModuleKey[];
  limits: {
    patients: number | null;
    professionals: number | null;
  };
};

export const PACKAGES = [
  {
    key: "basico",
    label: "Básico (Clínica)",
    description: "Núcleo para clínicas de pequeno porte",
    modules: ["patient", "doctor", "appointment", "prescription", "finance", "report"],
    limits: { patients: 500, professionals: 5 },
  },
  {
    key: "clinica",
    label: "Clínica+ / Odonto",
    description: "Clínica com odontologia e tratamentos",
    modules: [
      "patient", "doctor", "appointment", "prescription", "diagnosis", "treatment",
      "dental", "inventory", "finance", "report",
    ],
    limits: { patients: 2000, professionals: 20 },
  },
  {
    key: "diagnostico",
    label: "Diagnóstico",
    description: "Laboratório e imagem",
    modules: ["patient", "doctor", "appointment", "lab", "radiology", "report", "finance"],
    limits: { patients: 5000, professionals: 30 },
  },
  {
    key: "farmacia",
    label: "Farmácia",
    description: "Farmácia clínica e estoque",
    modules: ["medicine", "pharmacy", "inventory", "report", "finance"],
    limits: { patients: null, professionals: 10 },
  },
  {
    key: "hospital",
    label: "Hospital Completo",
    description: "Operação hospitalar completa",
    modules: [
      "patient", "doctor", "appointment", "prescription", "diagnosis", "treatment",
      "nurse", "bed", "emergency", "ambulance", "equipment", "lab", "radiology", "pharmacy",
      "medicine", "inventory", "insurance", "finance", "accountant", "payroll",
      "attendance", "notice", "email", "report", "file", "chat",
    ],
    limits: { patients: null, professionals: null },
  },
] as const satisfies readonly PackageDefinition[];

export type PackageKey = (typeof PACKAGES)[number]["key"];

export const ADDON_MODULES = ["sms", "site", "ai_image", "ai_overview", "chat", "equipment"] as const;

export function getPackage(key: PackageKey): PackageDefinition | undefined {
  return PACKAGES.find((p) => p.key === key);
}

export function resolveTenantModules(
  packageKey: PackageKey,
  addons: ModuleKey[] = [],
): ModuleKey[] {
  const pkg = getPackage(packageKey);
  const base = pkg ? [...pkg.modules] : [];
  return Array.from(new Set<ModuleKey>([...base, ...addons]));
}
