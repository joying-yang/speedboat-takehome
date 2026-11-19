import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revokeApiKey } from "../../api/api-keys";
import { queryKeys } from "../../api/query-keys";
import type { ApiKey } from "../../api/types";
import { Button } from "../../components/ui/Button/Button";
import dialogStyles from "../../components/ui/Dialog/Dialog.module.css";
import type { KeyWorkflowAction } from "./key-workflow-reducer";
import styles from "./KeyWorkflow.module.css";

type RevokeKeyDialogProps = {
  keyRecord: ApiKey;
  dispatch: React.Dispatch<KeyWorkflowAction>;
};

export function RevokeKeyDialog({ keyRecord, dispatch }: RevokeKeyDialogProps) {
  const queryClient = useQueryClient();
  const maskedValue = `${keyRecord.prefix}••••${keyRecord.last_four}`;
  const revokeMutation = useMutation({
    mutationFn: () => revokeApiKey(keyRecord.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeysRoot });
      dispatch({ type: "REVOKE_COMPLETE" });
    },
  });

  function close() {
    if (!revokeMutation.isPending) dispatch({ type: "CANCEL_REVOKE" });
  }

  return (
    <AlertDialog.Root open onOpenChange={(open) => !open && close()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={dialogStyles.overlay} />
        <AlertDialog.Content className={`${dialogStyles.content} ${dialogStyles.confirmationContent}`}>
          <AlertDialog.Title>Revoke API key?</AlertDialog.Title>
          <AlertDialog.Description className={dialogStyles.confirmationDescription}>
            Requests using this credential will stop working immediately.
          </AlertDialog.Description>

          <div className={styles.revokeKeySummary}>
            <strong>{keyRecord.name}</strong>
            <code>{maskedValue}</code>
          </div>

          <ul className={styles.warningList}>
            <li>This action cannot be undone.</li>
            <li>The key will remain visible in the console as revoked.</li>
            <li>Create a replacement before revoking if the key is still in use.</li>
          </ul>

          {revokeMutation.isError && (
            <div className="inline-error" role="alert">
              {revokeMutation.error.message}
            </div>
          )}

          <div className={dialogStyles.actions}>
            <AlertDialog.Cancel asChild>
              <Button disabled={revokeMutation.isPending}>Cancel</Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              loading={revokeMutation.isPending}
              loadingLabel={`Revoking ${keyRecord.name}`}
              onClick={() => revokeMutation.mutate()}
            >
              Revoke key
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
