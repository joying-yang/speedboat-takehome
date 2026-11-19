import { useQuery } from "@tanstack/react-query";
import { ArrowRight, KeyRound } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUsageConsumers, type UsageFilters } from "../../api/usage";
import { queryKeys } from "../../api/query-keys";
import { Button } from "../../components/ui/Button/Button";
import {
  DataTable,
  DataTableCell,
  DataTableHeaderCell,
  DataTablePagination,
  DataTableRow,
  DataTableRowHeader,
  DataTableSortHeader,
  DataTableSurface,
} from "../../components/ui/DataTable/DataTable";
import { QueryStatePanel } from "../../components/ui/QueryStatePanel/QueryStatePanel";
import { formatCompactNumber, formatUsd } from "../../utils/formatters";
import { getUsageMetricTotal } from "./usage-metrics";
import {
  defaultTopConsumerPageSize,
  readTopConsumerPage,
} from "./top-consumers-search-params";
import { readTopConsumersSort, sortTopConsumers } from "./top-consumers-sort";
import type { UsageMetric } from "./usage-search-params";
import styles from "./TopConsumersTable.module.css";

const metricLabels: Record<UsageMetric, string> = {
  spend: "spend",
  tokens: "tokens",
  requests: "requests",
};

export function TopConsumersTable({ filters }: { filters: UsageFilters }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortMetric = readTopConsumersSort(searchParams.get("consumerSort"));
  const requestedPage = readTopConsumerPage(searchParams.get("consumerPage"));
  const consumersQuery = useQuery({
    queryKey: queryKeys.usageConsumers(filters),
    queryFn: () => getUsageConsumers(filters),
  });
  const rows = sortTopConsumers(consumersQuery.data?.data ?? [], sortMetric);
  const totalPages = Math.max(1, Math.ceil(rows.length / defaultTopConsumerPageSize));
  const page = Math.min(requestedPage, totalPages);
  const firstRow = (page - 1) * defaultTopConsumerPageSize;
  const visibleRows = rows.slice(firstRow, firstRow + defaultTopConsumerPageSize);

  useEffect(() => {
    if (!consumersQuery.data || requestedPage === page) return;

    const next = new URLSearchParams(searchParams);
    if (page === 1) next.delete("consumerPage");
    else next.set("consumerPage", String(page));
    setSearchParams(next, { replace: true });
  }, [consumersQuery.data, page, requestedPage, searchParams, setSearchParams]);

  function selectSortMetric(metric: UsageMetric) {
    const next = new URLSearchParams(searchParams);
    if (metric === "spend") next.delete("consumerSort");
    else next.set("consumerSort", metric);
    next.delete("consumerPage");
    setSearchParams(next, { replace: true });
  }

  function updatePage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    const next = new URLSearchParams(searchParams);
    if (safePage === 1) next.delete("consumerPage");
    else next.set("consumerPage", String(safePage));
    setSearchParams(next);
  }

  function viewKey(keyName: string) {
    navigate({ pathname: "/console/keys", search: `?q=${encodeURIComponent(keyName)}` });
  }

  return (
    <section className="section-stack" aria-labelledby="top-consumers-title">
      <div className={styles.heading}>
        <h3 id="top-consumers-title">Top consumers</h3>
        <p>Key and model combinations ranked by {metricLabels[sortMetric]} for the selected filters.</p>
      </div>

      <DataTableSurface>
        {consumersQuery.isPending ? (
          <QueryStatePanel state="loading" title="Loading top consumers…" />
        ) : consumersQuery.isError ? (
          <QueryStatePanel
            state="error"
            title="Couldn’t load top consumers."
            description={consumersQuery.error.message}
            onRetry={() => consumersQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <QueryStatePanel
            state="empty"
            icon={<KeyRound size={24} />}
            title="No consumer usage in this period"
            description="Adjust the filters or choose another time range."
          />
        ) : (
          <>
            <DataTable aria-label="Top consumers">
              <thead>
                <tr>
                  <DataTableHeaderCell>Key name</DataTableHeaderCell>
                  <DataTableHeaderCell>Credential</DataTableHeaderCell>
                  <DataTableHeaderCell>Model</DataTableHeaderCell>
                  <DataTableSortHeader
                    label="Spend"
                    direction={sortMetric === "spend" ? "desc" : null}
                    align="end"
                    onSort={() => selectSortMetric("spend")}
                  />
                  <DataTableSortHeader
                    label="Tokens"
                    direction={sortMetric === "tokens" ? "desc" : null}
                    align="end"
                    onSort={() => selectSortMetric("tokens")}
                  />
                  <DataTableSortHeader
                    label="Requests"
                    direction={sortMetric === "requests" ? "desc" : null}
                    align="end"
                    onSort={() => selectSortMetric("requests")}
                  />
                  <DataTableHeaderCell align="end">
                    <span className="sr-only">Action</span>
                  </DataTableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <DataTableRow key={`${row.api_key_id}:${row.model}`}>
                    <DataTableRowHeader>{row.api_key_name}</DataTableRowHeader>
                    <DataTableCell><code className={styles.credential}>{row.credential}</code></DataTableCell>
                    <DataTableCell><span className={styles.model}>{row.model}</span></DataTableCell>
                    <DataTableCell align="end">
                      <strong className="type-mono-md">{formatUsd(row.spend_usd)}</strong>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <strong className="type-mono-md">
                        {formatCompactNumber(getUsageMetricTotal(row, "tokens"))}
                      </strong>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <strong className="type-mono-md">{formatCompactNumber(row.requests)}</strong>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <Button
                        size="compact"
                        variant="ghost"
                        leadingIcon={<ArrowRight size={16} />}
                        aria-label={`View key: ${row.api_key_name}`}
                        onClick={() => viewKey(row.api_key_name)}
                      >
                        View
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </tbody>
            </DataTable>
            <DataTablePagination
              page={page}
              pageSize={defaultTopConsumerPageSize}
              totalItems={rows.length}
              itemLabel={rows.length === 1 ? "consumer" : "consumers"}
              onPageChange={updatePage}
            />
          </>
        )}
      </DataTableSurface>
    </section>
  );
}
