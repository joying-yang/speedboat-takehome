export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  last_four: string;
  scopes: string[];
  spend_limit_usd: number | null;
  spend_used_usd: number;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type CreatedApiKey = ApiKey & {
  secret: string;
};

export type CreateApiKeyInput = {
  name: string;
  scopes: string[];
  spend_limit_usd: number | null;
};

export type UpdateApiKeyInput = Partial<
  Pick<CreateApiKeyInput, "name" | "scopes" | "spend_limit_usd">
>;

export type UsagePoint = {
  ts: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  spend_usd: number;
};

export type UsageTotals = Omit<UsagePoint, "ts">;

export type UsageReport = {
  object: "usage_report";
  start: string;
  end: string;
  granularity: "hour" | "day";
  filters: {
    api_key_id: string | null;
    model: string | null;
  };
  series: UsagePoint[];
  totals: UsageTotals;
};

export type UsageConsumer = UsageTotals & {
  api_key_id: string;
  api_key_name: string;
  credential: string;
  model: string;
};

export type UsageConsumersReport = {
  object: "usage_consumers";
  start: string;
  end: string;
  filters: {
    api_key_id: string | null;
    model: string | null;
  };
  data: UsageConsumer[];
};

export type Model = {
  id: string;
  object: string;
  owned_by?: string;
};

export type ListResponse<T> = {
  object: "list";
  data: T[];
};
