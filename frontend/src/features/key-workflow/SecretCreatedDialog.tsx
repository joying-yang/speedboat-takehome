import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button/Button";
import dialogStyles from "../../components/ui/Dialog/Dialog.module.css";
import { IconButton } from "../../components/ui/IconButton/IconButton";
import { WarningNotice } from "../../components/ui/WarningNotice/WarningNotice";
import type { KeyWorkflowAction, KeyWorkflowState } from "./key-workflow-reducer";
import styles from "./KeyWorkflow.module.css";

type SecretState = Extract<KeyWorkflowState, { step: "show-secret" }>;

type SecretCreatedDialogProps = {
  state: SecretState;
  dispatch: React.Dispatch<KeyWorkflowAction>;
};

export function SecretCreatedDialog({ state, dispatch }: SecretCreatedDialogProps) {
  const [copyError, setCopyError] = useState<string | null>(null);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(state.secret);
      setCopyError(null);
      dispatch({ type: "SECRET_COPIED" });
    } catch {
      setCopyError("Clipboard access failed. Select and copy the key manually.");
    }
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        // Ignore accidental Escape/outside-click dismissal until the user has
        // confirmed secure storage. Clipboard success alone does not guarantee
        // that the one-time secret was saved.
        if (!open && hasStoredSecret) dispatch({ type: "COMPLETE" });
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={dialogStyles.overlay} />
        <Dialog.Content className={`${dialogStyles.content} ${styles.secretDialog}`}>
          <Dialog.Title>API key created</Dialog.Title>
          <Dialog.Description>
            Copy <strong>{state.keyName}</strong> now. You will not be able to see it again.
          </Dialog.Description>

          <div className={styles.secretValue}>
            <code>{state.secret}</code>
            <IconButton
              label="Copy API key"
              onClick={copySecret}
              icon={state.copied ? <Check size={18} /> : <Copy size={18} />}
            />
          </div>
          <p className={styles.copyStatus} role="status">
            {state.copied ? "Copied to clipboard." : "Store this key in a secure secret manager."}
          </p>
          {state.notice && (
            <WarningNotice title="Some settings weren’t saved" messages={[state.notice]} />
          )}
          {copyError && <div className="inline-error" role="alert">{copyError}</div>}

          <div className={`${dialogStyles.actions} ${styles.secretActions}`}>
            <label className={styles.secretAcknowledgement}>
              <input
                type="checkbox"
                checked={hasStoredSecret}
                onChange={(event) => setHasStoredSecret(event.target.checked)}
              />
              <span>I saved this key in a secure location.</span>
            </label>
            <Button
              variant="primary"
              disabled={!hasStoredSecret}
              onClick={() => dispatch({ type: "COMPLETE" })}
            >
              I’ve saved the key
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
