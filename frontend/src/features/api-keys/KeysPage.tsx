import { useQuery } from "@tanstack/react-query";
import { Ban, KeyRound, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import { listApiKeys } from "../../api/api-keys";
import { queryKeys } from "../../api/query-keys";
import { RelativeTimestamp } from "../../components/RelativeTimestamp";
import { Button } from "../../components/ui/Button/Button";
import {
  DataTable,
  DataTableCell,
  DataTableHeaderCell,
  DataTablePagination,
  DataTableRow,
  DataTableRowHeader,
  DataTableSurface,
} from "../../components/ui/DataTable/DataTable";
import { IconButton } from "../../components/ui/IconButton/IconButton";
import { QueryStatePanel } from "../../components/ui/QueryStatePanel/QueryStatePanel";
import { Select } from "../../components/ui/Select/Select";
import { TextField } from "../../components/ui/TextField/TextField";
import { AccountSpendLimit } from "../spend-limits/AccountSpendLimit";
import { CreateKeyDialog } from "../key-workflow/CreateKeyDialog";
import { EditKeyDialog } from "../key-workflow/EditKeyDialog";
import { RevokeKeyDialog } from "../key-workflow/RevokeKeyDialog";
import { SecretCreatedDialog } from "../key-workflow/SecretCreatedDialog";
import {
  initialKeyWorkflowState,
  keyWorkflowReducer,
} from "../key-workflow/key-workflow-reducer";
import { defaultKeyPageSize, readKeyPage, readKeyStatus } from "./key-search-params";
import { KeySpend } from "./KeySpend";
import { KeySortHeader } from "./KeySortHeader";
import { nextKeySort, readKeySort, sortKeyRows, type KeySortColumn } from "./key-sort";
import { toKeyRowViewModel } from "./key-row-view-model";
import styles from "./KeysPage.module.css";

export function KeysPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workflow, dispatch] = useReducer(
    keyWorkflowReducer,
    initialKeyWorkflowState,
  );
  const search = searchParams.get("q") ?? "";
  const status = readKeyStatus(searchParams.get("status"));
  const requestedPage = readKeyPage(searchParams.get("page"));
  const sortColumn = searchParams.get("sort");
  const sortDirection = searchParams.get("direction");
  const sort = useMemo(
    () => readKeySort(sortColumn, sortDirection),
    [sortColumn, sortDirection],
  );

  const keysQuery = useQuery({
    queryKey: queryKeys.apiKeys(true),
    queryFn: () => listApiKeys(true),
  });

  const rows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filteredRows = (keysQuery.data?.data ?? [])
      .map(toKeyRowViewModel)
      .filter((key) => status === "all" || key.status === status)
      .filter(
        (key) =>
          !normalizedSearch ||
          key.name.toLowerCase().includes(normalizedSearch) ||
          key.maskedValue.toLowerCase().includes(normalizedSearch),
      );
    return sortKeyRows(filteredRows, sort);
  }, [keysQuery.data, search, sort, status]);
  const totalPages = Math.max(1, Math.ceil(rows.length / defaultKeyPageSize));
  const page = Math.min(requestedPage, totalPages);
  // The mock list endpoint has no cursor or limit parameters. Keep the slice at
  // this boundary so a future server-paginated query can replace it directly.
  const visibleRows = useMemo(() => {
    const firstRow = (page - 1) * defaultKeyPageSize;
    return rows.slice(firstRow, firstRow + defaultKeyPageSize);
  }, [page, rows]);

  useEffect(() => {
    if (!keysQuery.data || requestedPage === page) return;

    const next = new URLSearchParams(searchParams);
    if (page === 1) next.delete("page");
    else next.set("page", String(page));
    setSearchParams(next, { replace: true });
  }, [keysQuery.data, page, requestedPage, searchParams, setSearchParams]);

  function updateFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(name);
    else next.set(name, value);
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function updatePage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    const next = new URLSearchParams(searchParams);
    if (safePage === 1) next.delete("page");
    else next.set("page", String(safePage));
    setSearchParams(next);
  }

  function updateSort(column: KeySortColumn) {
    const nextSort = nextKeySort(sort, column);
    const next = new URLSearchParams(searchParams);
    if (nextSort) {
      next.set("sort", nextSort.column);
      next.set("direction", nextSort.direction);
    } else {
      next.delete("sort");
      next.delete("direction");
    }
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  return (
    <section className="section-stack" aria-labelledby="keys-title">
      <AccountSpendLimit />

      <div className="section-heading">
        <div>
          <h2 id="keys-title">API keys</h2>
          <p>Create credentials and monitor their access and spend.</p>
        </div>
        <Button
          variant="primary"
          leadingIcon={<Plus size={16} />}
          onClick={() => dispatch({ type: "OPEN_CREATE" })}
        >
          Create key
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchControl}>
          <TextField
            label="Search"
            type="search"
            value={search}
            placeholder="Search by name or credential"
            onChange={(event) => updateFilter("q", event.target.value)}
          />
        </div>
        <div className={styles.statusControl}>
          <Select
            label="Status"
            value={status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </Select>
        </div>
      </div>

      <DataTableSurface>
        {keysQuery.isPending ? (
          <QueryStatePanel state="loading" title="Loading API keys…" />
        ) : keysQuery.isError ? (
          <QueryStatePanel
            state="error"
            title="Couldn’t load API keys."
            description={keysQuery.error.message}
            onRetry={() => keysQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <QueryStatePanel
            state="empty"
            icon={<KeyRound size={24} />}
            title="No matching API keys"
            description="Adjust the filters or create a new key."
          />
        ) : (
          <>
            <DataTable aria-label="API keys">
              <thead>
                <tr>
                  <KeySortHeader column="name" label="Key name" sort={sort} onSort={updateSort} />
                  <DataTableHeaderCell>Credential</DataTableHeaderCell>
                  <KeySortHeader column="last-used" label="Last used" sort={sort} onSort={updateSort} />
                  <KeySortHeader column="spend" label="Monthly spend" sort={sort} onSort={updateSort} />
                  <DataTableHeaderCell>Actions</DataTableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((key) => (
                  <DataTableRow
                    key={key.id}
                    tone={key.status === "revoked" ? "muted" : "default"}
                  >
                    <DataTableRowHeader>
                      <span className={styles.keyName}>{key.name}</span>
                      <div className={styles.scopeList}>
                        {key.scopeRows.map((scopeRow) => (
                          <div className={styles.scopeRow} key={scopeRow.join("|")}>
                            {scopeRow.map((scope) => (
                              <span className={styles.scopePill} key={scope}>{scope}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </DataTableRowHeader>
                    <DataTableCell><code>{key.maskedValue}</code></DataTableCell>
                    <DataTableCell><RelativeTimestamp value={key.last_used_at} /></DataTableCell>
                    <DataTableCell>
                      <KeySpend keyRecord={key} />
                    </DataTableCell>
                    <DataTableCell>
                      {key.status === "active" ? (
                        <div className={styles.actionGroup}>
                          <IconButton
                            variant="ghost"
                            label={`Edit ${key.name}`}
                            title={`Edit ${key.name}`}
                            icon={<Pencil size={16} />}
                            onClick={() => dispatch({ type: "OPEN_EDIT", keyRecord: key })}
                          />
                          <IconButton
                            variant="dangerGhost"
                            label={`Revoke ${key.name}`}
                            title={`Revoke ${key.name}`}
                            icon={<Ban size={16} />}
                            onClick={() => dispatch({ type: "OPEN_REVOKE", keyRecord: key })}
                          />
                        </div>
                      ) : (
                        <span className="status-badge revoked">Revoked</span>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </tbody>
            </DataTable>
            <DataTablePagination
              page={page}
              pageSize={defaultKeyPageSize}
              totalItems={rows.length}
              itemLabel={rows.length === 1 ? "key" : "keys"}
              onPageChange={updatePage}
            />
          </>
        )}
      </DataTableSurface>

      {workflow.step === "create" && (
        <CreateKeyDialog dispatch={dispatch} />
      )}
      {workflow.step === "show-secret" && (
        <SecretCreatedDialog state={workflow} dispatch={dispatch} />
      )}
      {workflow.step === "edit" && (
        <EditKeyDialog keyRecord={workflow.keyRecord} dispatch={dispatch} />
      )}
      {workflow.step === "confirm-revoke" && (
        <RevokeKeyDialog keyRecord={workflow.keyRecord} dispatch={dispatch} />
      )}
    </section>
  );
}
