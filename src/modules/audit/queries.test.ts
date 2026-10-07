import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeQuery } from "@/test-utils/mock-supabase";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { listAuditLogs } from "@/modules/audit/queries";

beforeEach(() => vi.clearAllMocks());

describe("listAuditLogs", () => {
  it("mapeia linhas e o nome do autor", async () => {
    const query = makeQuery({
      data: [
        {
          id: 1,
          created_at: "2026-10-06T00:00:00Z",
          action: "UPDATE",
          entity: "patients",
          entity_id: "p1",
          actor: { full_name: "Ana" },
          metadata: { changes: {} },
        },
      ],
      error: null,
    });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) });

    const logs = await listAuditLogs(10);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      id: 1,
      action: "UPDATE",
      entity: "patients",
      actor_name: "Ana",
    });
  });

  it("trata autor ausente", async () => {
    const query = makeQuery({
      data: [
        {
          id: 2,
          created_at: "2026-10-06T00:00:00Z",
          action: "INSERT",
          entity: "patients",
          entity_id: "p2",
          actor: null,
          metadata: null,
        },
      ],
      error: null,
    });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) });

    const logs = await listAuditLogs();
    expect(logs[0].actor_name).toBeNull();
  });
});
