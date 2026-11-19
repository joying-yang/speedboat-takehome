import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendDisplay } from "./TrendDisplay";

describe("TrendDisplay", () => {
  it("distinguishes loading, request failure, and absent prior data", () => {
    const { rerender } = render(
      <TrendDisplay trendRatio={null} isLoading isError={false} />,
    );
    expect(screen.getByText("Comparing…")).toBeInTheDocument();

    rerender(<TrendDisplay trendRatio={null} isLoading={false} isError />);
    expect(screen.getByText("Comparison unavailable")).toBeInTheDocument();

    rerender(<TrendDisplay trendRatio={null} isLoading={false} isError={false} />);
    expect(screen.getByText("No prior data")).toBeInTheDocument();
  });
});
