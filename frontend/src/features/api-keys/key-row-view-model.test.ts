import { describe, expect, it } from "vitest";
import type { ApiKey } from "../../api/types";
import { toKeyRowViewModel } from "./key-row-view-model";

const baseKey: ApiKey = {
  id: "key_123",
  name: "Production",
  prefix: "psk-prod-",
  last_four: "1234",
  scopes: ["inference:read"],
  spend_limit_usd: 25,
  spend_used_usd: 5,
  created_at: "2026-05-01T00:00:00Z",
  last_used_at: null,
  revoked_at: null,
};

describe("toKeyRowViewModel", () => {
  it("groups canonically ordered scope codes into rows of at most two", () => {
    const mixed = toKeyRowViewModel({
      ...baseKey,
      scopes: ["admin", "billing:write", "inference:read"],
    });

    expect(mixed.scopeRows).toEqual([
      ["inference:read", "billing:write"],
      ["admin"],
    ]);
  });

  it.each([
    { spendUsed: 5, expectedPercent: 20, expectedTone: "normal" },
    { spendUsed: 20, expectedPercent: 80, expectedTone: "warning" },
    { spendUsed: 30, expectedPercent: 120, expectedTone: "danger" },
  ] as const)(
    "reports $expectedPercent% with a $expectedTone tone",
    ({ spendUsed, expectedPercent, expectedTone }) => {
      const row = toKeyRowViewModel({ ...baseKey, spend_used_usd: spendUsed });

      expect(row.spendPercent).toBe(expectedPercent);
      expect(row.spendTone).toBe(expectedTone);
    },
  );
});
