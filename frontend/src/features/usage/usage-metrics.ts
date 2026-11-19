import type { UsageTotals } from "../../api/types";
import type { UsageMetric } from "./usage-search-params";

export function getUsageMetricTotal(totals: UsageTotals, metric: UsageMetric) {
  if (metric === "spend") return totals.spend_usd;
  if (metric === "requests") return totals.requests;
  return totals.input_tokens + totals.output_tokens;
}

export function calculateTrendRatio(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}
