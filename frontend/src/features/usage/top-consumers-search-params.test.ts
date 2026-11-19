import { describe, expect, it } from "vitest";
import { readTopConsumerPage } from "./top-consumers-search-params";

describe("readTopConsumerPage", () => {
  it.each([null, "", "0", "-1", "1.5", "not-a-number"])(
    "falls back to page one for %s",
    (value) => {
      expect(readTopConsumerPage(value)).toBe(1);
    },
  );

  it("accepts positive integer pages", () => {
    expect(readTopConsumerPage("3")).toBe(3);
  });
});
