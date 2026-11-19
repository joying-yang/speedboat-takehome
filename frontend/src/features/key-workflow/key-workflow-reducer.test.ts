import { describe, expect, it } from "vitest";
import { initialKeyWorkflowState, keyWorkflowReducer } from "./key-workflow-reducer";

describe("keyWorkflowReducer", () => {
  it("moves from create to the one-time secret state", () => {
    const creating = keyWorkflowReducer(initialKeyWorkflowState, { type: "OPEN_CREATE" });
    const created = keyWorkflowReducer(creating, {
      type: "KEY_CREATED",
      keyName: "Production",
      secret: "psk-access-secret",
    });

    expect(created).toEqual({
      step: "show-secret",
      keyName: "Production",
      secret: "psk-access-secret",
      copied: false,
    });
  });

  it("does not cancel a one-time secret state", () => {
    const secretState = {
      step: "show-secret" as const,
      keyName: "Production",
      secret: "psk-access-secret",
      copied: false,
    };

    expect(keyWorkflowReducer(secretState, { type: "CANCEL" })).toBe(secretState);
  });

  it("opens and closes the edit workflow for a specific key", () => {
    const keyRecord = {
      id: "key_123",
      name: "Production",
      prefix: "psk-prod-",
      last_four: "1234",
      scopes: ["inference:read"],
      spend_limit_usd: 25,
      spend_used_usd: 5,
      created_at: "2026-05-01T00:00:00Z",
      last_used_at: null,
      revoked_at: null,
    };

    const editing = keyWorkflowReducer(initialKeyWorkflowState, {
      type: "OPEN_EDIT",
      keyRecord,
    });
    expect(editing).toEqual({ step: "edit", keyRecord });
    expect(keyWorkflowReducer(editing, { type: "CANCEL_EDIT" })).toEqual({ step: "idle" });
  });

  it("keeps revoke confirmation tied to the selected key", () => {
    const keyRecord = {
      id: "key_123",
      name: "Production",
      prefix: "psk-prod-",
      last_four: "1234",
      scopes: ["inference:read"],
      spend_limit_usd: 25,
      spend_used_usd: 5,
      created_at: "2026-05-01T00:00:00Z",
      last_used_at: null,
      revoked_at: null,
    };

    const confirming = keyWorkflowReducer(initialKeyWorkflowState, {
      type: "OPEN_REVOKE",
      keyRecord,
    });
    expect(confirming).toEqual({ step: "confirm-revoke", keyRecord });
    expect(keyWorkflowReducer(confirming, { type: "REVOKE_COMPLETE" })).toEqual({ step: "idle" });
  });

});
