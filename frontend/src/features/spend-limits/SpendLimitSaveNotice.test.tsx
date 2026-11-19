import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpendLimitSaveNotice } from "./SpendLimitSaveNotice";

describe("SpendLimitSaveNotice", () => {
  it("summarizes a cap and thresholds with consistent save language", () => {
    render(
      <SpendLimitSaveNotice
        monthlyLimit="25"
        monthlyLimitChanged
        thresholds={[50, 80, 100]}
        thresholdMode={{ kind: "set" }}
      />,
    );

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("Review before saving");
    expect(notice).toHaveTextContent("Monthly cap will be set to $25.00 per month.");
    expect(notice).toHaveTextContent(
      "Alert thresholds will be set at 50%, 80%, and 100% of the monthly cap.",
    );
    expect(notice).toHaveTextContent(
      "New usage may be blocked when the monthly cap is reached.",
    );
  });

  it("describes removing all saved thresholds", () => {
    render(
      <SpendLimitSaveNotice
        monthlyLimit="1000"
        monthlyLimitChanged={false}
        thresholds={[]}
        thresholdMode={{ kind: "compare", baseline: [50, 80] }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Alert thresholds will be removed.");
  });

  it("stays hidden when no spend-control values changed", () => {
    const { container } = render(
      <SpendLimitSaveNotice
        monthlyLimit="1000"
        monthlyLimitChanged={false}
        thresholds={[50, 80]}
        thresholdMode={{ kind: "compare", baseline: [80, 50] }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
