import { describe, expect, it } from "vitest";
import { previousDemoRange } from "./usage-search-params";

describe("previousDemoRange", () => {
  it("returns the preceding equal-length seven-day window", () => {
    expect(previousDemoRange("7d")).toEqual({
      start: "2026-04-22T00:00:00.000Z",
      end: "2026-04-29T00:00:00.000Z",
      granularity: "day",
    });
  });

  it("returns the preceding 24-hour window", () => {
    expect(previousDemoRange("24h")).toEqual({
      start: "2026-05-04T00:00:00.000Z",
      end: "2026-05-05T00:00:00.000Z",
      granularity: "hour",
    });
  });
});
