import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("associates its visible label and error with the input", () => {
    render(<TextField label="Key name" error="Enter a key name." />);

    const input = screen.getByRole("textbox", { name: "Key name" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a key name.");
  });
});
