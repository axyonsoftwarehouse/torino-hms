import type { Instrumentation } from "next";

import { reportError } from "@/lib/report-error";

export async function register() {
  // Garante o fuso horário do Brasil em ambientes UTC (ex.: Vercel).
  // O nome "TZ" é reservado como env var na Vercel, então fixamos aqui.
  if (!process.env.TZ) {
    process.env.TZ = "America/Sao_Paulo";
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  await reportError(error, {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
