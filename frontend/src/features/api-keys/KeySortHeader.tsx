import { DataTableSortHeader } from "../../components/ui/DataTable/DataTable";
import type { KeySort, KeySortColumn } from "./key-sort";

type KeySortHeaderProps = {
  column: KeySortColumn;
  label: string;
  sort: KeySort | null;
  onSort: (column: KeySortColumn) => void;
};

export function KeySortHeader({ column, label, sort, onSort }: KeySortHeaderProps) {
  const isActive = sort?.column === column;
  const direction = isActive ? sort.direction : null;

  return (
    <DataTableSortHeader
      label={label}
      direction={direction}
      onSort={() => onSort(column)}
    />
  );
}
