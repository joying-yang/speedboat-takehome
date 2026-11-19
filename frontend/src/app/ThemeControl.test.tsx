import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeControl } from "./ThemeControl";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

describe("ThemeControl", () => {
  it("switches themes and restores system mode", async () => {
    const user = userEvent.setup();
    render(<ThemeControl />);
    const control = screen.getByRole("combobox", { name: "Color theme" });

    expect(control).toHaveValue("system");
    expect(document.documentElement).not.toHaveAttribute("data-theme");

    await user.selectOptions(control, "light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("parasail-console-theme")).toBe("light");

    await user.selectOptions(control, "dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    await user.selectOptions(control, "system");
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(localStorage.getItem("parasail-console-theme")).toBeNull();
  });

  it("uses a saved preference when it mounts", () => {
    localStorage.setItem("parasail-console-theme", "dark");
    render(<ThemeControl />);

    expect(screen.getByRole("combobox", { name: "Color theme" })).toHaveValue("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
