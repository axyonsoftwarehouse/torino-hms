import { describe, expect, it } from "vitest";

import {
  TEAM_ROLES,
  inviteSchema,
  memberActiveSchema,
  memberRoleSchema,
} from "@/modules/team/schema";

describe("team schema", () => {
  it("memberRoleSchema aceita papéis válidos e rejeita inválidos", () => {
    expect(memberRoleSchema.parse({ profile_id: "p1", role: "nurse" }).role).toBe("nurse");
    expect(memberRoleSchema.safeParse({ profile_id: "p1", role: "root" }).success).toBe(false);
    expect(memberRoleSchema.safeParse({ profile_id: "", role: "nurse" }).success).toBe(false);
  });

  it("memberActiveSchema só aceita 'true'/'false'", () => {
    expect(memberActiveSchema.parse({ profile_id: "p1", active: "true" }).active).toBe("true");
    expect(memberActiveSchema.safeParse({ profile_id: "p1", active: "yes" }).success).toBe(false);
  });

  it("inviteSchema valida e-mail", () => {
    expect(inviteSchema.parse({ email: " user@torino.com ", role: "professional" }).email).toBe(
      "user@torino.com",
    );
    expect(inviteSchema.safeParse({ email: "invalido", role: "professional" }).success).toBe(false);
  });

  it("TEAM_ROLES inclui superadmin (revisar exposição na UI)", () => {
    expect(TEAM_ROLES).toContain("superadmin");
  });
});
