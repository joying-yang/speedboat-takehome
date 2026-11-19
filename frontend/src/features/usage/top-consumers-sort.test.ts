import { describe, expect, it } from "vitest";
import type { UsageConsumer } from "../../api/types";
import { readTopConsumersSort, sortTopConsumers } from "./top-consumers-sort";

const consumers: UsageConsumer[] = [
  {
    api_key_id: "key_spend",
    api_key_name: "Spend leader",
    credential: "psk-spend-••••0001",
    model: "model-a",
    spend_usd: 30,
    requests: 20,
    input_tokens: 100,
    output_tokens: 100,
  },
  {
    api_key_id: "key_requests",
    api_key_name: "Request leader",
    credential: "psk-requests-••••0002",
    model: "model-b",
    spend_usd: 10,
    requests: 60,
    input_tokens: 200,
    output_tokens: 200,
  },
  {
    api_key_id: "key_tokens",
    api_key_name: "Token leader",
    credential: "psk-tokens-••••0003",
    model: "model-c",
    spend_usd: 20,
    requests: 40,
    input_tokens: 600,
    output_tokens: 400,
  },
];

describe("top-consumers-sort", () => {
  it("defaults invalid URL values to spend", () => {
    expect(readTopConsumersSort(null)).toBe("spend");
    expect(readTopConsumersSort("unknown")).toBe("spend");
    expect(readTopConsumersSort("tokens")).toBe("tokens");
  });

  it.each([
    ["spend", "Spend leader"],
    ["requests", "Request leader"],
    ["tokens", "Token leader"],
  ] as const)("ranks the highest %s consumer first", (metric, expectedName) => {
    expect(sortTopConsumers(consumers, metric)[0].api_key_name).toBe(expectedName);
  });
});
