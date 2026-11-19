import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithQueryClient } from "../test/render-with-query-client";
import { AuthenticationBoundary } from "./AuthenticationBoundary";
import {
  clearAuthenticationFailure,
  reportAuthenticationFailure,
} from "./authentication-error-store";

describe("AuthenticationBoundary", () => {
  afterEach(() => clearAuthenticationFailure());

  it("replaces route content after an unauthorized error and can retry", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <AuthenticationBoundary><div>Protected route content</div></AuthenticationBoundary>,
    );

    expect(screen.getByText("Protected route content")).toBeInTheDocument();

    act(() => reportAuthenticationFailure({ status: 401, type: "unauthorized" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to authenticate");
    expect(screen.queryByText("Protected route content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Protected route content")).toBeInTheDocument();
  });

  it("does not replace content for a non-authentication error", () => {
    renderWithQueryClient(
      <AuthenticationBoundary><div>Protected route content</div></AuthenticationBoundary>,
    );

    act(() => reportAuthenticationFailure({ status: 503, type: "service_unavailable" }));

    expect(screen.getByText("Protected route content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
