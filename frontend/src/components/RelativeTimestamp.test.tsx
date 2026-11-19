import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RelativeTimestamp } from "./RelativeTimestamp";

describe("RelativeTimestamp", () => {
  it("shows the exact timestamp in a tooltip without a duplicate native title", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RelativeTimestamp value="2026-05-04T22:11:43Z" />,
    );
    const time = container.querySelector("time");
    if (!time) throw new Error("Expected a semantic time element.");

    expect(time).not.toHaveAttribute("title");
    expect(time).toHaveAccessibleName(/May 4, 2026 at/);

    await user.hover(time);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(/May 4, 2026 at/);
  });

  it("keeps the explicit fallback for keys that were never used", () => {
    render(<RelativeTimestamp value={null} />);
    expect(screen.getByText("Never used")).toBeInTheDocument();
  });
});
