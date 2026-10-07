import { vi } from "vitest";

export type QueryResult = { data?: unknown; error?: unknown };

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "is",
  "order",
  "limit",
  "range",
  "or",
  "filter",
  "match",
] as const;

/**
 * Query builder fake do Supabase: encadeável, com `single`/`maybeSingle` e
 * "thenable" (para `await supabase.from(...).insert(...)`).
 */
export function makeQuery(result: QueryResult = { data: null, error: null }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (resolve: (value: QueryResult) => unknown) => unknown;
  } = {};

  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn(() => builder);
  }

  builder.single = vi.fn(async () => result);
  builder.maybeSingle = vi.fn(async () => result);
  builder.then = (resolve) => Promise.resolve(result).then(resolve);

  return builder;
}

/** Cliente Supabase fake mínimo, com `from` e `rpc`. */
export function makeSupabase(result: QueryResult = { data: null, error: null }) {
  const from = vi.fn(() => makeQuery(result));
  const rpc = vi.fn(async () => result);
  return { from, rpc };
}
