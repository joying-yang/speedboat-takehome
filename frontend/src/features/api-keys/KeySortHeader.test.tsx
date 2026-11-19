import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KeySortHeader } from "./KeySortHeader";

describe("KeySortHeader", () => {
  it("exposes sort semantics and sends keyboard-accessible interactions", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    const { rerender } = render(
      <table>
        <thead>
          <tr>
            <KeySortHeader column="spend" label="Monthly spend" sort={null} onSort={onSort} />
          </tr>
        </thead>
      </table>,
    );

    expect(screen.getByRole("columnheader", { name: "Monthly spend" }))
      .toHaveAttribute("aria-sort", "none");
    await user.click(screen.getByRole("button", { name: "Monthly spend" }));
    expect(onSort).toHaveBeenCalledWith("spend");

    rerender(
      <table>
        <thead>
          <tr>
            <KeySortHeader
              column="spend"
              label="Monthly spend"
              sort={{ column: "spend", direction: "desc" }}
              onSort={onSort}
            />
          </tr>
        </thead>
      </table>,
    );
    expect(screen.getByRole("columnheader", { name: "Monthly spend" }))
      .toHaveAttribute("aria-sort", "descending");
  });
});
