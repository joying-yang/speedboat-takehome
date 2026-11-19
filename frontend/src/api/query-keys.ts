import type { UsageFilters } from "./usage";

const apiKeysRoot = ["api-keys"] as const;

export const queryKeys = {
  apiKeysRoot,
  apiKeys: (includeRevoked: boolean) =>
    [...apiKeysRoot, { includeRevoked }] as const,
  accountSpendLimit: ["account-spend-limit"] as const,
  models: ["models"] as const,
  usage: (filters: UsageFilters) => ["usage", filters] as const,
  usageConsumers: (filters: UsageFilters) => ["usage-consumers", filters] as const,
};
