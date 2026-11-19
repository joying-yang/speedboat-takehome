import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ApiKey } from "../../api/types";
import { KeySpend } from "./KeySpend";
import styles from "./KeysPage.module.css";
import { toKeyRowViewModel } from "./key-row-view-model";

const keyRecord: ApiKey = {
  id: "key_123",
  name: "Production",
  prefix: "psk-prod-",
  last_four: "1234",
  scopes: ["inference:read"],
  spend_limit_usd: 25,
  spend_used_usd: 30,
  created_at: "2026-05-01T00:00:00Z",
  last_used_at: null,
  revoked_at: null,
};

describe("KeySpend", () => {
  it("renders the true over-limit percentage with danger treatment", () => {
    render(<KeySpend keyRecord={toKeyRowViewModel(keyRecord)} />);

    expect(screen.getByText("$30.00")).toBeInTheDocument();
    expect(screen.getByText("120% used")).toHaveClass(styles.danger);
  });

  it("renders near-limit usage with warning treatment", () => {
    render(
      <KeySpend
        keyRecord={toKeyRowViewModel({ ...keyRecord, spend_used_usd: 20 })}
      />,
    );

    expect(screen.getByText("80% used")).toHaveClass(styles.warning);
  });
});
