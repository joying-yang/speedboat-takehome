import { apiRequest } from "./client";
import type { ListResponse, Model, UsageConsumersReport, UsageReport } from "./types";

export type UsageFilters = {
  start: string;
  end: string;
  granularity: "hour" | "day";
  apiKeyId?: string;
  model?: string;
};

export function getUsage(filters: UsageFilters) {
  return apiRequest<UsageReport>(`/v1/usage?${usageQuery(filters)}`);
}

export function getUsageConsumers(filters: UsageFilters) {
  return apiRequest<UsageConsumersReport>(`/v1/usage/consumers?${usageQuery(filters)}`);
}

function usageQuery(filters: UsageFilters) {
  const query = new URLSearchParams({
    start: filters.start,
    end: filters.end,
    granularity: filters.granularity,
  });

  if (filters.apiKeyId) query.set("api_key_id", filters.apiKeyId);
  if (filters.model) query.set("model", filters.model);

  return query;
}

export function listModels() {
  return apiRequest<ListResponse<Model>>("/v1/models");
}

