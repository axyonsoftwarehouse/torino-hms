import { describe, expect, it } from "vitest";

import { optionalInt, optionalMoneyCents, optionalNumber, optionalUuid } from "@/lib/validation";

describe("optionalUuid", () => {
  it("converte vazio em null e mantém valores", () => {
    expect(optionalUuid.parse("")).toBeNull();
    expect(optionalUuid.parse("   ")).toBeNull();
    expect(optionalUuid.parse("abc-123")).toBe("abc-123");
  });
});

describe("optionalInt", () => {
  it("converte vazio em null e inteiros válidos", () => {
    expect(optionalInt.parse("")).toBeNull();
    expect(optionalInt.parse("10")).toBe(10);
    expect(optionalInt.parse("0")).toBe(0);
  });

  it("rejeita negativos e não-inteiros", () => {
    expect(optionalInt.safeParse("-1").success).toBe(false);
    expect(optionalInt.safeParse("1.5").success).toBe(false);
    expect(optionalInt.safeParse("abc").success).toBe(false);
  });
});

describe("optionalMoneyCents", () => {
  it("normaliza formatos de moeda para centavos", () => {
    expect(optionalMoneyCents.parse("")).toBeNull();
    expect(optionalMoneyCents.parse("10")).toBe(1000);
    expect(optionalMoneyCents.parse("10,50")).toBe(1050);
    expect(optionalMoneyCents.parse("1.234,56")).toBe(123456);
  });

  it("rejeita valores inválidos", () => {
    expect(optionalMoneyCents.safeParse("abc").success).toBe(false);
    expect(optionalMoneyCents.safeParse("-5").success).toBe(false);
  });
});

describe("optionalNumber", () => {
  it("aceita decimal com vírgula", () => {
    expect(optionalNumber.parse("")).toBeNull();
    expect(optionalNumber.parse("3,5")).toBe(3.5);
    expect(optionalNumber.parse("2")).toBe(2);
  });

  it("rejeita negativos e texto", () => {
    expect(optionalNumber.safeParse("-2").success).toBe(false);
    expect(optionalNumber.safeParse("abc").success).toBe(false);
  });
});
