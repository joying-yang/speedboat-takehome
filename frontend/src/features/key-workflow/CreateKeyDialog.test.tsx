import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { renderWithQueryClient } from "../../test/render-with-query-client";
import { CreateKeyDialog } from "./CreateKeyDialog";
import type { KeyWorkflowAction } from "./key-workflow-reducer";

function CreateDialogHarness() {
  const [open, setOpen] = useState(true);

  function dispatch(action: KeyWorkflowAction) {
    if (action.type === "CANCEL") setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open create dialog</button>
      {open && <CreateKeyDialog dispatch={dispatch} />}
    </>
  );
}

function renderCreateDialog() {
  return renderWithQueryClient(<CreateDialogHarness />);
}

describe("CreateKeyDialog", () => {
  it("starts with a fresh draft after cancellation and reopening", async () => {
    const user = userEvent.setup();
    renderCreateDialog();

    const keyName = screen.getByRole("textbox", { name: "Key name" });
    await user.type(keyName, "Abandoned draft");
    await user.click(screen.getByRole("checkbox", { name: /Administrator access/ }));
    await user.type(screen.getByRole("textbox", { name: /Monthly cap/ }), "25");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Create API key" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open create dialog" }));
    expect(screen.getByRole("textbox", { name: "Key name" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: /Monthly cap/ })).toHaveValue("");
    expect(screen.getByRole("checkbox", { name: /Administrator access/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Inference read.*inference:read/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Inference write.*inference:write/ })).toBeChecked();
  });

  it("clears selected alert thresholds when the monthly cap is removed", async () => {
    const user = userEvent.setup();
    renderCreateDialog();

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
