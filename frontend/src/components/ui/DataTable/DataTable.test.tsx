import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DataTable,
  DataTableCell,
  DataTableHeaderCell,
  DataTablePagination,
  DataTableRow,
  DataTableRowHeader,
  DataTableSurface,
} from "./DataTable";

describe("DataTable", () => {
  it("preserves semantic column and row headers", () => {
    render(
      <DataTableSurface>
        <DataTable aria-label="Credentials">
          <thead>
            <tr>
              <DataTableHeaderCell>Name</DataTableHeaderCell>
              <DataTableHeaderCell align="end">Spend</DataTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            <DataTableRow tone="muted">
              <DataTableRowHeader>Production</DataTableRowHeader>
              <DataTableCell align="end">$25.00</DataTableCell>
            </DataTableRow>
          </tbody>
        </DataTable>
      </DataTableSurface>,
    );

    expect(screen.getByRole("table", { name: "Credentials" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("scope", "col");
    expect(screen.getByRole("rowheader", { name: "Production" })).toHaveAttribute("scope", "row");
    expect(screen.getByRole("cell", { name: "$25.00" })).toBeInTheDocument();
  });

  it("reports the visible range and requests adjacent pages", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <DataTablePagination
        page={2}
        pageSize={10}
        totalItems={25}
        itemLabel="keys"
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("11–20 of 25 keys")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });
});
