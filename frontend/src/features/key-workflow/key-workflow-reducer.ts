import type { ApiKey } from "../../api/types";

export type KeyWorkflowState =
  | { step: "idle" }
  | { step: "create" }
  | { step: "edit"; keyRecord: ApiKey }
  | { step: "confirm-revoke"; keyRecord: ApiKey }
  | {
      step: "show-secret";
      keyName: string;
      secret: string;
      copied: boolean;
      notice?: string;
    };

export type KeyWorkflowAction =
  | { type: "OPEN_CREATE" }
  | { type: "OPEN_EDIT"; keyRecord: ApiKey }
  | { type: "OPEN_REVOKE"; keyRecord: ApiKey }
  | {
      type: "KEY_CREATED";
      keyName: string;
      secret: string;
      notice?: string;
    }
  | { type: "SECRET_COPIED" }
  | { type: "CANCEL" }
  | { type: "CANCEL_EDIT" }
  | { type: "EDIT_COMPLETE" }
  | { type: "CANCEL_REVOKE" }
  | { type: "REVOKE_COMPLETE" }
  | { type: "COMPLETE" };

export const initialKeyWorkflowState: KeyWorkflowState = { step: "idle" };

// One discriminated state prevents contradictory combinations such as the
// create and secret dialogs being open simultaneously.
export function keyWorkflowReducer(
  state: KeyWorkflowState,
  action: KeyWorkflowAction,
): KeyWorkflowState {
  switch (action.type) {
    case "OPEN_CREATE":
      return { step: "create" };
    case "OPEN_EDIT":
      return { step: "edit", keyRecord: action.keyRecord };
    case "OPEN_REVOKE":
      return { step: "confirm-revoke", keyRecord: action.keyRecord };
    case "KEY_CREATED":
      return {
        step: "show-secret",
        keyName: action.keyName,
        secret: action.secret,
        copied: false,
        notice: action.notice,
      };
    case "SECRET_COPIED":
      return state.step === "show-secret"
        ? { ...state, copied: true }
        : state;
    case "CANCEL":
      return state.step === "create" ? { step: "idle" } : state;
    case "CANCEL_EDIT":
    case "EDIT_COMPLETE":
      return state.step === "edit" ? { step: "idle" } : state;
    case "CANCEL_REVOKE":
    case "REVOKE_COMPLETE":
      return state.step === "confirm-revoke" ? { step: "idle" } : state;
    case "COMPLETE":
      return { step: "idle" };
  }
}
