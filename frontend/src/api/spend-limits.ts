import { apiRequest } from "./client";

export type SpendLimitInput = {
  scope: "account" | "api_key";
  api_key_id?: string;
  monthly_limit_usd: number;
  alert_thresholds_pct: number[];
};

export type SpendLimit = Omit<SpendLimitInput, "api_key_id"> & {
  id: string;
  api_key_id: string | null;
  created_at: string;
};

export function createSpendLimit(input: SpendLimitInput) {
  return apiRequest<SpendLimit>("/v1/spend-limits", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// TODO(spend-limit-persistence): The mock has no GET/PATCH/DELETE contract for
// spend-limit settings, so alert thresholds cannot be rehydrated after refresh.
