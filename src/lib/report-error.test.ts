import { afterEach, describe, expect, it, vi } from "vitest";

import { reportError } from "@/lib/report-error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reportError", () => {
  it("emite log estruturado com mensagem, digest e contexto", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error("boom"), { digest: "abc" });

    await reportError(error, { path: "/app", routeType: "action" });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      level: "error",
      message: "boom",
      digest: "abc",
      path: "/app",
      routeType: "action",
    });
  });

  it("aceita valores que não são Error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await reportError("falha");
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload.message).toBe("falha");
  });
});
