import { describe, expect, it } from "vitest";
import type { ApiKey } from "../../api/types";
import { toKeyRowViewModel } from "./key-row-view-model";
import { nextKeySort, readKeySort, sortKeyRows } from "./key-sort";

const baseKey: ApiKey = {
  id: "key_1",
  name: "Beta",
  prefix: "psk-beta-",
  last_four: "1234",
  scopes: ["inference:read"],
  spend_limit_usd: 25,
  spend_used_usd: 5,
  created_at: "2026-05-01T00:00:00Z",
  last_used_at: "2026-05-02T00:00:00Z",
  revoked_at: null,
};

describe("key sorting", () => {
  it("parses only complete supported URL sort values", () => {
    expect(readKeySort("spend", "desc")).toEqual({ column: "spend", direction: "desc" });
    expect(readKeySort("unknown", "desc")).toBeNull();
    expect(readKeySort("name", "sideways")).toBeNull();
  });

  it("cycles from the contextual default through reverse and back to unsorted", () => {
    const first = nextKeySort(null, "name");
    const second = nextKeySort(first, "name");
    const third = nextKeySort(second, "name");

    expect(first).toEqual({ column: "name", direction: "asc" });
    expect(second).toEqual({ column: "name", direction: "desc" });
    expect(third).toBeNull();
    expect(nextKeySort(null, "spend")).toEqual({ column: "spend", direction: "desc" });
  });

  it("sorts filtered rows by name, last use, and spend", () => {
    const rows = [
      toKeyRowViewModel(baseKey),
      toKeyRowViewModel({
        ...baseKey,
        id: "key_2",
        name: "Alpha",
        spend_used_usd: 12,
        last_used_at: "2026-05-04T00:00:00Z",
      }),
    ];

    expect(sortKeyRows(rows, { column: "name", direction: "asc" }).map((row) => row.name))
      .toEqual(["Alpha", "Beta"]);
    expect(sortKeyRows(rows, { column: "last-used", direction: "desc" }).map((row) => row.name))
      .toEqual(["Alpha", "Beta"]);
    expect(sortKeyRows(rows, { column: "spend", direction: "desc" }).map((row) => row.name))
      .toEqual(["Alpha", "Beta"]);
  });

  it("keeps active keys before revoked keys when no column sort is selected", () => {
    const active = toKeyRowViewModel(baseKey);
    const revoked = toKeyRowViewModel({
      ...baseKey,
      id: "key_revoked",
      revoked_at: "2026-05-03T00:00:00Z",
    });

    expect(sortKeyRows([revoked, active], null).map((row) => row.id))
      .toEqual(["key_1", "key_revoked"]);
  });
});
