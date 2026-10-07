/**
 * Reporta um erro de servidor de forma estruturada (JSON no console, capturado
 * pelos logs da Vercel). Ponto único para plugar um provedor (ex.: Sentry) depois:
 * basta enviar o payload também para o DSN, sem mudar os call sites.
 */
export async function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest)
      : undefined;
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      source: "server",
      message,
      digest,
      stack,
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}
