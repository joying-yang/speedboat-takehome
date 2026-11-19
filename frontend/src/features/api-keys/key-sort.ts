import type { KeyRowViewModel } from "./key-row-view-model";

export type KeySortColumn = "name" | "last-used" | "spend";
export type SortDirection = "asc" | "desc";
export type KeySort = {
  column: KeySortColumn;
  direction: SortDirection;
};

const defaultDirections: Record<KeySortColumn, SortDirection> = {
  name: "asc",
  "last-used": "desc",
  spend: "desc",
};

export function readKeySort(
  column: string | null,
  direction: string | null,
): KeySort | null {
  if (column !== "name" && column !== "last-used" && column !== "spend") {
    return null;
  }
  if (direction !== "asc" && direction !== "desc") return null;
  return { column, direction };
}

export function nextKeySort(
  current: KeySort | null,
  column: KeySortColumn,
): KeySort | null {
  const defaultDirection = defaultDirections[column];
  if (!current || current.column !== column) {
    return { column, direction: defaultDirection };
  }
  if (current.direction === defaultDirection) {
    return { column, direction: defaultDirection === "asc" ? "desc" : "asc" };
  }
  return null;
}

export function sortKeyRows(rows: KeyRowViewModel[], sort: KeySort | null) {
  if (!sort) {
    return [...rows].sort(
      (first, second) =>
        Number(first.status === "revoked") - Number(second.status === "revoked"),
    );
  }

  return [...rows].sort((first, second) => {
    if (sort.column === "last-used") {
      if (first.last_used_at === null && second.last_used_at === null) return 0;
      if (first.last_used_at === null) return 1;
      if (second.last_used_at === null) return -1;
    }
    const comparison = compareRows(first, second, sort.column);
    return sort.direction === "asc" ? comparison : -comparison;
  });
}

function compareRows(
  first: KeyRowViewModel,
  second: KeyRowViewModel,
  column: KeySortColumn,
) {
  if (column === "name") {
    return first.name.localeCompare(second.name, undefined, { sensitivity: "base" });
  }
  if (column === "spend") {
    return first.spend_used_usd - second.spend_used_usd;
  }

  return Date.parse(first.last_used_at ?? "") - Date.parse(second.last_used_at ?? "");
}
