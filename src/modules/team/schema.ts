import { z } from "zod";

export const TEAM_ROLES = [
  "superadmin",
  "tenant_admin",
  "professional",
  "receptionist",
  "nurse",
  "pharmacist",
  "laboratorist",
  "accountant",
  "patient",
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  superadmin: "Superadmin",
  tenant_admin: "Admin do tenant",
  professional: "Profissional",
  receptionist: "Recepção",
  nurse: "Enfermagem",
  pharmacist: "Farmácia",
  laboratorist: "Laboratório",
  accountant: "Contabilidade",
  patient: "Paciente",
};

export const memberRoleSchema = z.object({
  profile_id: z.string().trim().min(1, "Membro inválido"),
  role: z.enum(TEAM_ROLES),
});

export const memberActiveSchema = z.object({
  profile_id: z.string().trim().min(1, "Membro inválido"),
  active: z.enum(["true", "false"]),
});

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Informe o e-mail")
    .refine((value) => /.+@.+\..+/.test(value), "E-mail inválido"),
  role: z.enum(TEAM_ROLES),
});
