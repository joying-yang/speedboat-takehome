import type { UsageConsumer } from "../../api/types";
import { getUsageMetricTotal } from "./usage-metrics";
import type { UsageMetric } from "./usage-search-params";

export function readTopConsumersSort(value: string | null): UsageMetric {
  return value === "tokens" || value === "requests" ? value : "spend";
}

export function sortTopConsumers(rows: UsageConsumer[], metric: UsageMetric) {
  return [...rows].sort((first, second) => {
    const metricDifference = getUsageMetricTotal(second, metric)
      - getUsageMetricTotal(first, metric);
    if (metricDifference !== 0) return metricDifference;

    const keyDifference = first.api_key_name.localeCompare(second.api_key_name, undefined, {
      sensitivity: "base",
    });
    return keyDifference || first.model.localeCompare(second.model);
  });
}
