import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SecretCreatedDialog } from "./SecretCreatedDialog";
import type { KeyWorkflowAction, KeyWorkflowState } from "./key-workflow-reducer";

const state: Extract<KeyWorkflowState, { step: "show-secret" }> = {
  step: "show-secret",
  keyName: "Test key",
  secret: "psk-test-secret",
  copied: false,
};

describe("SecretCreatedDialog", () => {
  it("requires secure-storage acknowledgement independently of clipboard success", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const dispatch = vi.fn<(action: KeyWorkflowAction) => void>();
    render(<SecretCreatedDialog state={state} dispatch={dispatch} />);

    const completeButton = screen.getByRole("button", { name: "I’ve saved the key" });
    expect(completeButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Copy API key" }));
    expect(writeText).toHaveBeenCalledWith(state.secret);
    expect(dispatch).toHaveBeenCalledWith({ type: "SECRET_COPIED" });
    expect(completeButton).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "I saved this key in a secure location." }));
    expect(completeButton).toBeEnabled();

    await user.click(completeButton);
    expect(dispatch).toHaveBeenLastCalledWith({ type: "COMPLETE" });
  });

  it("allows manual recovery when clipboard access fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("Clipboard permission denied"),
    );
    const dispatch = vi.fn<(action: KeyWorkflowAction) => void>();
    render(<SecretCreatedDialog state={state} dispatch={dispatch} />);

    await user.click(screen.getByRole("button", { name: "Copy API key" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Clipboard access failed. Select and copy the key manually.",
    );

    const completeButton = screen.getByRole("button", { name: "I’ve saved the key" });
    expect(completeButton).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "I saved this key in a secure location." }));
    expect(completeButton).toBeEnabled();
  });
});
