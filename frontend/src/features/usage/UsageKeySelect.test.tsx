import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ApiKey } from "../../api/types";
import { UsageKeySelect } from "./UsageKeySelect";

const keys: ApiKey[] = [
  {
    id: "key_active",
    name: "Production",
    prefix: "psk-active-",
    last_four: "1234",
    scopes: ["inference:read"],
    spend_limit_usd: null,
    spend_used_usd: 10,
    created_at: "2026-05-01T00:00:00Z",
    last_used_at: "2026-05-05T00:00:00Z",
    revoked_at: null,
  },
  {
    id: "key_revoked",
    name: "Leaked credential",
    prefix: "psk-revoked-",
    last_four: "5678",
    scopes: ["inference:read"],
    spend_limit_usd: null,
    spend_used_usd: 25,
    created_at: "2026-04-01T00:00:00Z",
    last_used_at: "2026-05-04T00:00:00Z",
    revoked_at: "2026-05-05T00:00:00Z",
  },
];

describe("UsageKeySelect", () => {
  it("groups revoked keys and allows selecting them for historical usage", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UsageKeySelect
        keys={keys}
        isPending={false}
        isError={false}
        onChange={onChange}
      />,
    );

    const revokedOption = screen.getByRole("option", { name: "Leaked credential (revoked)" });
    expect(revokedOption.closest("optgroup")).toHaveAttribute("label", "Revoked keys");

    await user.selectOptions(screen.getByRole("combobox", { name: "API key" }), "key_revoked");
    expect(onChange).toHaveBeenCalledWith("key_revoked");
  });
});
