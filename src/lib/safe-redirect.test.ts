import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeRedirectPath("/app")).toBe("/app");
    expect(safeRedirectPath("/app/patients?page=2")).toBe("/app/patients?page=2");
    expect(safeRedirectPath("/invite/abc123")).toBe("/invite/abc123");
  });

  it("bloqueia URLs protocol-relative (open redirect)", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/app");
    expect(safeRedirectPath("//evil.com/path")).toBe("/app");
    expect(safeRedirectPath("/\\evil.com")).toBe("/app");
  });

  it("bloqueia URLs absolutas", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/app");
    expect(safeRedirectPath("http://evil.com")).toBe("/app");
  });

  it("bloqueia caminhos relativos sem barra inicial", () => {
    expect(safeRedirectPath("app/patients")).toBe("/app");
  });

  it("usa o fallback quando vazio/ausente e respeita fallback customizado", () => {
    expect(safeRedirectPath(undefined)).toBe("/app");
    expect(safeRedirectPath(null)).toBe("/app");
    expect(safeRedirectPath("")).toBe("/app");
    expect(safeRedirectPath("//evil.com", "/login")).toBe("/login");
  });
});
