import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AlertThresholdFields } from "./AlertThresholdFields";

describe("AlertThresholdFields", () => {
  it("reports a sorted threshold selection and percentage labels", async () => {
    const onChange = vi.fn();
    render(
      <AlertThresholdFields
        value={[80]}
        onChange={onChange}
        helperText="Choose thresholds."
      />,
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.queryByText("of monthly cap")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: /50%/ }));
    expect(onChange).toHaveBeenCalledWith([50, 80]);
  });
});
