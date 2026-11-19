import { describe, expect, it } from "vitest";
import { readKeyPage, readKeyStatus } from "./key-search-params";

describe("readKeyPage", () => {
  it.each([null, "", "0", "-1", "1.5", "not-a-number"])(
    "falls back to page one for %s",
    (value) => {
      expect(readKeyPage(value)).toBe(1);
    },
  );

  it("accepts positive integer pages", () => {
    expect(readKeyPage("3")).toBe(3);
  });
});

describe("readKeyStatus", () => {
  it("accepts supported filters and falls back to all", () => {
    expect(readKeyStatus("active")).toBe("active");
    expect(readKeyStatus("revoked")).toBe("revoked");
    expect(readKeyStatus("disabled")).toBe("all");
    expect(readKeyStatus(null)).toBe("all");
  });
});
