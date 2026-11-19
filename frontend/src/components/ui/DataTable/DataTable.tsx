import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { Button } from "../Button/Button";
import styles from "./DataTable.module.css";

type Alignment = "start" | "end";
type RowTone = "default" | "muted";

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function DataTableSurface({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={classNames(styles.surface, className)}
    />
  );
}

export function DataTable({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.scroller}>
      <table
        {...props}
        className={classNames(styles.table, className)}
      />
    </div>
  );
}

export function DataTableRow({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { tone?: RowTone }) {
  return (
    <tr
      {...props}
      className={classNames(tone === "muted" ? styles.mutedRow : undefined, className)}
    />
  );
}

export function DataTableHeaderCell({
  align = "start",
  className,
  scope = "col",
  ...props
}: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & { align?: Alignment }) {
  return (
    <th
      {...props}
      scope={scope}
      className={classNames(
        styles.headerCell,
        align === "end" ? styles.alignEnd : undefined,
        className,
      )}
    />
  );
}

type DataTableSortHeaderProps = {
  label: string;
  direction: "asc" | "desc" | null;
  align?: Alignment;
  onSort: () => void;
};

export function DataTableSortHeader({
  label,
  direction,
  align = "start",
  onSort,
}: DataTableSortHeaderProps) {
  const SortIcon = direction === "asc"
    ? ArrowUp
    : direction === "desc"
      ? ArrowDown
      : ArrowUpDown;

  return (
    <DataTableHeaderCell
      align={align}
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
    >
      <button
        type="button"
        className={classNames(
          styles.sortButton,
          align === "end" ? styles.sortButtonEnd : undefined,
          direction ? styles.activeSort : undefined,
        )}
        onClick={onSort}
      >
        <span>{label}</span>
        <SortIcon size={14} aria-hidden="true" />
      </button>
    </DataTableHeaderCell>
  );
}

export function DataTableRowHeader({
  className,
  scope = "row",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      scope={scope}
      className={classNames(styles.rowHeader, className)}
    />
  );
}

export function DataTableCell({
  align = "start",
  className,
  ...props
}: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & { align?: Alignment }) {
  return (
    <td
      {...props}
      className={classNames(
        styles.cell,
        align === "end" ? styles.alignEnd : undefined,
        className,
      )}
    />
  );
}

type DataTablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  itemLabel,
  onPageChange,
}: DataTablePaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav className={styles.pagination} aria-label={`${itemLabel} pagination`}>
      <span className={styles.paginationSummary} aria-live="polite">
        {firstItem}–{lastItem} of {totalItems} {itemLabel}
      </span>
      <div className={styles.paginationControls}>
        <Button
          size="compact"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className={styles.pageStatus}>Page {page} of {totalPages}</span>
        <Button
          size="compact"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
