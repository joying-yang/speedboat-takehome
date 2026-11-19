import { useQuery } from "@tanstack/react-query";
import { Activity, CircleDollarSign, Waypoints } from "lucide-react";
import type { CSSProperties } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSearchParams } from "react-router-dom";
import { listApiKeys } from "../../api/api-keys";
import { queryKeys } from "../../api/query-keys";
import { getUsage, listModels, type UsageFilters } from "../../api/usage";
import { QueryStatePanel } from "../../components/ui/QueryStatePanel/QueryStatePanel";
import { Select } from "../../components/ui/Select/Select";
import { formatCompactNumber, formatUsd } from "../../utils/formatters";
import { calculateTrendRatio, getUsageMetricTotal } from "./usage-metrics";
import { TopConsumersTable } from "./TopConsumersTable";
import { TrendDisplay } from "./TrendDisplay";
import { UsageSupportNotice, type UsageSupportFailure } from "./UsageSupportNotice";
import { UsageKeySelect } from "./UsageKeySelect";
import styles from "./UsagePage.module.css";
import {
  demoRange,
  previousDemoRange,
  readUsageMetric,
  readUsageRange,
  type UsageMetric,
} from "./usage-search-params";

const dayLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const hourLabel = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  timeZone: "UTC",
});

const chartTooltipContentStyle: CSSProperties = {
  margin: 0,
  padding: "var(--space-3)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-control)",
  color: "var(--text-primary)",
  backgroundColor: "var(--bg-surface)",
  boxShadow: "var(--shadow-raised)",
};

const chartTooltipLabelStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontWeight: "var(--type-heading-sm-weight)",
};

const chartTooltipItemStyle: CSSProperties = {
  paddingTop: "var(--space-1)",
  paddingBottom: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--type-mono-sm-size)",
  fontWeight: "var(--type-mono-sm-weight)",
};

const metricConfig: Record<
  UsageMetric,
  { label: string; dataKey: string; color: string; format: (value: number) => string }
> = {
  spend: {
    label: "Spend",
    dataKey: "spend_usd",
    color: "var(--accent-primary)",
    format: formatUsd,
  },
  requests: {
    label: "Requests",
    dataKey: "requests",
    color: "var(--state-success)",
    format: formatCompactNumber,
  },
  tokens: {
    label: "Tokens",
    dataKey: "tokens",
    color: "var(--state-warning)",
    format: formatCompactNumber,
  },
};

export function UsagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const metric = readUsageMetric(searchParams.get("metric"));
  const range = readUsageRange(searchParams.get("range"));
  const apiKeyId = searchParams.get("key") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const selectedRange = demoRange(range);
  const comparisonRange = previousDemoRange(range);
  const filters: UsageFilters = { ...selectedRange, apiKeyId, model };
  const comparisonFilters: UsageFilters = { ...comparisonRange, apiKeyId, model };

  const usageQuery = useQuery({
    queryKey: queryKeys.usage(filters),
    queryFn: () => getUsage(filters),
  });
  const comparisonQuery = useQuery({
    queryKey: queryKeys.usage(comparisonFilters),
    queryFn: () => getUsage(comparisonFilters),
  });
  const keysQuery = useQuery({
    queryKey: queryKeys.apiKeys(true),
    queryFn: () => listApiKeys(true),
  });
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: listModels,
  });

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(name);
    else next.set(name, value);
    if (name === "key" || name === "model" || name === "range") {
      next.delete("consumerPage");
    }
    setSearchParams(next, { replace: true });
  }

  const config = metricConfig[metric];
  const chartData = (usageQuery.data?.series ?? []).map((point) => ({
    ...point,
    tokens: point.input_tokens + point.output_tokens,
    label:
      range === "24h"
        ? hourLabel.format(new Date(point.ts))
        : dayLabel.format(new Date(point.ts)),
  }));
  const totals = usageQuery.data?.totals;
  const currentMetricTotal = totals ? getUsageMetricTotal(totals, metric) : undefined;
  const previousMetricTotal = comparisonQuery.data?.totals
    ? getUsageMetricTotal(comparisonQuery.data.totals, metric)
    : undefined;
  const trendRatio = currentMetricTotal !== undefined && previousMetricTotal !== undefined
    ? calculateTrendRatio(currentMetricTotal, previousMetricTotal)
    : null;
  const supportFailures: UsageSupportFailure[] = [
    ...(keysQuery.isError
      ? [{ id: "api-keys", label: "API-key filters", onRetry: () => void keysQuery.refetch() }]
      : []),
    ...(modelsQuery.isError
      ? [{ id: "models", label: "model filters", onRetry: () => void modelsQuery.refetch() }]
      : []),
    ...(comparisonQuery.isError
      ? [{
          id: "comparison",
          label: "previous-period comparison",
          onRetry: () => void comparisonQuery.refetch(),
        }]
      : []),
  ];
  const selectedTotal = currentMetricTotal === undefined ? "—" : config.format(currentMetricTotal);
  const selectedIcon = metric === "spend"
    ? <CircleDollarSign />
    : metric === "requests"
      ? <Activity />
      : <Waypoints />;

  return (
    <section className="section-stack" aria-labelledby="usage-title">
      <div className="section-heading">
        <div>
          <h2 id="usage-title">Usage overview</h2>
          <p>Monitor spend and activity across API keys and models.</p>
        </div>
        <p className={styles.periodLabel}>Demo data: Apr 29–May 5, 2026</p>
      </div>

      <div className={styles.filterBar}>
        <UsageKeySelect
          keys={keysQuery.data?.data}
          value={apiKeyId}
          isPending={keysQuery.isPending}
          isError={keysQuery.isError}
          onChange={(value) => setParam("key", value)}
        />
        <Select
          label="Model"
          value={model ?? "all"}
          disabled={modelsQuery.isPending || modelsQuery.isError}
          helperText={modelsQuery.isPending ? "Loading models…" : undefined}
          error={modelsQuery.isError ? "Model filters unavailable. Use retry below." : undefined}
          onChange={(event) => setParam("model", event.target.value)}
        >
            <option value="all">All models</option>
            {model && !modelsQuery.data?.data.some((item) => item.id === model) && (
              <option value={model}>{model}</option>
            )}
            {modelsQuery.data?.data.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
        </Select>
        <div className={styles.rangeField}>
          <Select
            label="Time range"
            value={range}
            onChange={(event) => setParam("range", event.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="24h">Last 24 hours</option>
          </Select>
        </div>
      </div>

      <UsageSupportNotice failures={supportFailures} />

      {usageQuery.isError ? (
        <QueryStatePanel
          state="error"
          className="card"
          title="Couldn’t load usage."
          description={usageQuery.error.message}
          onRetry={() => usageQuery.refetch()}
        />
      ) : (
        <>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <MetricSummary
                icon={selectedIcon}
                label={`Total ${config.label.toLowerCase()}`}
                value={selectedTotal}
                isLoading={usageQuery.isPending}
                trendRatio={trendRatio}
                isTrendLoading={usageQuery.isPending || comparisonQuery.isPending}
                isTrendError={comparisonQuery.isError}
              />

              <div className={styles.metricTabs} aria-label="Usage metric">
                {(["spend", "requests", "tokens"] as const).map((item) => (
                  <button
                    key={item}
                    className={metric === item ? styles.active : undefined}
                    aria-pressed={metric === item}
                    onClick={() => setParam("metric", item)}
                  >
                    {metricConfig[item].label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chartBody}>
              <div className={styles.chartHeading}>
                <div>
                  <h3>{config.label} over time</h3>
                  <p>{apiKeyId || model ? "Filtered usage" : "All account usage"}</p>
                </div>
              </div>

              <div className={styles.chartArea} aria-busy={usageQuery.isPending}>
                {usageQuery.isPending ? (
                  <div className={styles.chartSkeleton}>Loading usage…</div>
                ) : chartData.every((point) => Number(point[config.dataKey as keyof typeof point]) === 0) ? (
                  <div className="state-panel">No usage in this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
                      <defs>
                        <linearGradient id="usage-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={config.color} stopOpacity={0.24} />
                          <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border-default)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        interval={range === "24h" ? 1 : "preserveEnd"}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                      />
                      <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={config.format} tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                      <Tooltip
                        formatter={(value) => config.format(Number(value))}
                        contentStyle={chartTooltipContentStyle}
                        labelStyle={chartTooltipLabelStyle}
                        itemStyle={chartTooltipItemStyle}
                        cursor={{ stroke: "var(--text-tertiary)", strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey={config.dataKey}
                        stroke={config.color}
                        strokeWidth={2}
                        fill="url(#usage-fill)"
                        activeDot={{
                          r: 4,
                          fill: "var(--bg-surface)",
                          stroke: config.color,
                          strokeWidth: 2,
                        }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <TopConsumersTable filters={filters} />
        </>
      )}
    </section>
  );
}

function MetricSummary({
  icon,
  label,
  value,
  isLoading,
  trendRatio,
  isTrendLoading,
  isTrendError,
}: {
  icon: React.ReactElement;
  label: string;
  value: string;
  isLoading: boolean;
  trendRatio: number | null;
  isTrendLoading: boolean;
  isTrendError: boolean;
}) {
  return (
    <div className={styles.totalSummary} aria-busy={isLoading}>
      <div className={styles.summaryIcon}>{icon}</div>
      <div className={styles.totalCopy}>
        <span>{label}</span>
        <div className={styles.metricRow}>
          <strong className="type-metric">{value}</strong>
          <TrendDisplay
            trendRatio={trendRatio}
            isLoading={isTrendLoading}
            isError={isTrendError}
          />
        </div>
      </div>
    </div>
  );
}
