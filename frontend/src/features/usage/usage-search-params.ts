export type UsageMetric = "spend" | "requests" | "tokens";
export type UsageRange = "7d" | "24h";

export function readUsageMetric(value: string | null): UsageMetric {
  return value === "requests" || value === "tokens" ? value : "spend";
}

export function readUsageRange(value: string | null): UsageRange {
  return value === "24h" ? "24h" : "7d";
}

// The supplied mock has a fixed May 2026 seed window. Keeping that concern in
// this adapter makes it easy to replace with a rolling current-time range when
// the API serves live data.
export function demoRange(range: UsageRange) {
  if (range === "24h") {
    return {
      start: "2026-05-05T00:00:00Z",
      end: "2026-05-06T00:00:00Z",
      granularity: "hour" as const,
    };
  }

  return {
    start: "2026-04-29T00:00:00Z",
    end: "2026-05-06T00:00:00Z",
    granularity: "day" as const,
  };
}

export function previousDemoRange(range: UsageRange) {
  const current = demoRange(range);
  const start = Date.parse(current.start);
  const duration = Date.parse(current.end) - start;

  return {
    start: new Date(start - duration).toISOString(),
    end: new Date(start).toISOString(),
    granularity: current.granularity,
  };
}
