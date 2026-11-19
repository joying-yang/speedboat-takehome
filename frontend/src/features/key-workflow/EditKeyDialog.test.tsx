import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ApiKey } from "../../api/types";
import { renderWithQueryClient } from "../../test/render-with-query-client";
import { EditKeyDialog } from "./EditKeyDialog";

const keyWithoutCap: ApiKey = {
  id: "key_edit",
  name: "Edit test",
  prefix: "psk-edit-",
  last_four: "1234",
  scopes: ["inference:read"],
  spend_limit_usd: null,
  spend_used_usd: 0,
  created_at: "2026-11-01T00:00:00Z",
  last_used_at: null,
  revoked_at: null,
};

describe("EditKeyDialog", () => {
  it("clears selected alert thresholds when a newly entered cap is removed", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditKeyDialog keyRecord={keyWithoutCap} dispatch={vi.fn()} />,
    );

    const monthlyCap = screen.getByRole("textbox", { name: /Monthly cap/ });
    const fiftyPercent = screen.getByRole("checkbox", { name: "50%" });
    await user.type(monthlyCap, "25");
    await user.click(fiftyPercent);
    expect(fiftyPercent).toBeChecked();

    await user.clear(monthlyCap);
    expect(fiftyPercent).not.toBeChecked();
    expect(fiftyPercent).toBeDisabled();
  });
});
