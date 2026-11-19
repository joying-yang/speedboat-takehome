import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UsageSupportNotice } from "./UsageSupportNotice";

describe("UsageSupportNotice", () => {
  it("identifies each failed dependency and retries it independently", async () => {
    const user = userEvent.setup();
    const retryKeys = vi.fn();
    const retryComparison = vi.fn();
    render(
      <UsageSupportNotice
        failures={[
          { id: "keys", label: "API-key filters", onRetry: retryKeys },
          {
            id: "comparison",
            label: "previous-period comparison",
            onRetry: retryComparison,
          },
        ]}
      />,
    );

    expect(screen.getByText(/Unavailable: API-key filters, previous-period comparison/))
      .toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry API-key filters" }));
    expect(retryKeys).toHaveBeenCalledOnce();
    expect(retryComparison).not.toHaveBeenCalled();
  });
});
