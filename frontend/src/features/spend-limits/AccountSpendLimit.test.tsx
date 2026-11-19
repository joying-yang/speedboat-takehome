import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSpendLimit } from "../../api/spend-limits";
import {
  createTestQueryClient,
  renderWithQueryClient,
} from "../../test/render-with-query-client";
import { AccountSpendLimit } from "./AccountSpendLimit";

vi.mock("../../api/spend-limits", () => ({
  createSpendLimit: vi.fn(),
}));

function renderAccountLimit(queryClient = createTestQueryClient()) {
  return renderWithQueryClient(<AccountSpendLimit />, queryClient);
}

describe("AccountSpendLimit", () => {
  beforeEach(() => {
    vi.mocked(createSpendLimit).mockResolvedValue({
      id: "lim_account",
      scope: "account",
      api_key_id: null,
      monthly_limit_usd: 1000,
      alert_thresholds_pct: [],
      created_at: "2026-11-17T00:00:00Z",
    });
  });

  it("clears selected alert thresholds when the account cap is removed", async () => {
    const user = userEvent.setup();
    const { unmount } = renderAccountLimit();

    await user.click(screen.getByRole("button", { name: "Set monthly cap" }));
    const monthlyCap = screen.getByRole("textbox", { name: "Monthly cap" });
    const fiftyPercent = screen.getByRole("checkbox", { name: "50%" });
    await user.type(monthlyCap, "1000");
    await user.click(fiftyPercent);
    expect(fiftyPercent).toBeChecked();

    await user.clear(monthlyCap);
    expect(fiftyPercent).not.toBeChecked();
    expect(fiftyPercent).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    unmount();
  });

  it("retains the saved account cap across route-style unmounts", async () => {
    const user = userEvent.setup();
    const { queryClient, unmount } = renderAccountLimit();

    await user.click(screen.getByRole("button", { name: "Set monthly cap" }));
    await user.type(screen.getByRole("textbox", { name: "Monthly cap" }), "1000");
    await user.click(screen.getByRole("button", { name: "Save limit" }));

    await waitFor(() => {
      expect(createSpendLimit).toHaveBeenCalledWith({
        scope: "account",
        monthly_limit_usd: 1000,
        alert_thresholds_pct: [],
      });
    });
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("Saved this session")).toBeInTheDocument();
    expect(screen.getByText(/No alerts configured/)).toBeInTheDocument();

    unmount();
    renderAccountLimit(queryClient);
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("Saved this session")).toBeInTheDocument();
  });
});
