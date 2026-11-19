import { describe, expect, it } from "vitest";
import type { UsageTotals } from "../../api/types";
import { calculateTrendRatio, getUsageMetricTotal } from "./usage-metrics";

const totals: UsageTotals = {
  requests: 120,
  input_tokens: 800,
  output_tokens: 200,
  spend_usd: 4.5,
};

describe("usage metric helpers", () => {
  it("returns the total represented by each dashboard metric", () => {
    expect(getUsageMetricTotal(totals, "spend")).toBe(4.5);
    expect(getUsageMetricTotal(totals, "requests")).toBe(120);
    expect(getUsageMetricTotal(totals, "tokens")).toBe(1_000);
  });

  it("calculates change against the preceding period", () => {
    expect(calculateTrendRatio(125, 100)).toBe(0.25);
    expect(calculateTrendRatio(75, 100)).toBe(-0.25);
    expect(calculateTrendRatio(0, 0)).toBe(0);
    expect(calculateTrendRatio(10, 0)).toBeNull();
  });
});
