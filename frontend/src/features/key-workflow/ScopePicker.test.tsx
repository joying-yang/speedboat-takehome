import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { defaultApiScopes, type ApiScope } from "../../domain/api-scopes";
import { ScopePicker } from "./ScopePicker";

function ScopePickerHarness() {
  const [value, setValue] = useState<ApiScope[]>(defaultApiScopes);
  return <ScopePicker value={value} onChange={setValue} />;
}

describe("ScopePicker", () => {
  it("mixes resource scopes and makes administrator access exclusive", async () => {
    const user = userEvent.setup();
    render(<ScopePickerHarness />);

    const inferenceRead = screen.getByRole("checkbox", { name: /Inference read.*inference:read/ });
    const deploymentRead = screen.getByRole("checkbox", { name: /Deployments read.*deployments:read/ });
    const admin = screen.getByRole("checkbox", { name: /Administrator access/ });

    expect(inferenceRead).toBeChecked();
    await user.click(deploymentRead);
    expect(deploymentRead).toBeChecked();

    await user.click(admin);
    expect(admin).toBeChecked();
    expect(inferenceRead).not.toBeChecked();
    expect(inferenceRead).toBeDisabled();

    await user.click(admin);
    expect(inferenceRead).toBeEnabled();
  });
});
