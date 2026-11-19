import type { ApiKey } from "../../api/types";
import { sortApiScopes } from "../../domain/api-scopes";

export type KeyRowViewModel = ApiKey & {
  maskedValue: string;
  scopeRows: string[][];
  status: "active" | "revoked";
  spendPercent: number | null;
  spendTone: "normal" | "warning" | "danger";
};

const scopesPerRow = 2;

function groupScopeCodes(scopes: string[]) {
  return Array.from(
    { length: Math.ceil(scopes.length / scopesPerRow) },
    (_, index) => scopes.slice(index * scopesPerRow, (index + 1) * scopesPerRow),
  );
}

export function toKeyRowViewModel(key: ApiKey): KeyRowViewModel {
  const orderedScopes = sortApiScopes(key.scopes);
  const spendPercent = key.spend_limit_usd !== null && key.spend_limit_usd > 0
    ? (key.spend_used_usd / key.spend_limit_usd) * 100
    : null;

  return {
    ...key,
    maskedValue: `${key.prefix}••••${key.last_four}`,
    scopeRows: groupScopeCodes(orderedScopes),
    status: key.revoked_at ? "revoked" : "active",
    spendPercent,
    spendTone: spendPercent !== null && spendPercent >= 100
      ? "danger"
      : spendPercent !== null && spendPercent >= 80
        ? "warning"
        : "normal",
  };
}

