/**
 * Garante que um parâmetro de redirect aponte apenas para um caminho interno.
 * Bloqueia URLs absolutas e protocol-relative (ex.: "//evil.com").
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/app",
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/\\")) return fallback;
  return value;
}
