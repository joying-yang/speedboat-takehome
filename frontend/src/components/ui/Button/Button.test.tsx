import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("keeps its label in layout and exposes a loading state", () => {
    render(<Button loading loadingLabel="Creating API key">Create key</Button>);

    const button = screen.getByRole("button", { name: "Creating API key" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Create key")).toBeInTheDocument();
  });
});
