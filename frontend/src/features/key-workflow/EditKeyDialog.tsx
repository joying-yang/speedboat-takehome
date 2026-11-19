import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateApiKey } from "../../api/api-keys";
import { queryKeys } from "../../api/query-keys";
import { createSpendLimit } from "../../api/spend-limits";
import type { ApiKey, UpdateApiKeyInput } from "../../api/types";
import { Button } from "../../components/ui/Button/Button";
import dialogStyles from "../../components/ui/Dialog/Dialog.module.css";
import { IconButton } from "../../components/ui/IconButton/IconButton";
import { WarningNotice } from "../../components/ui/WarningNotice/WarningNotice";
import { DiscardChangesDialog } from "./DiscardChangesDialog";
import {
  keySettingsSchema,
  type KeySettingsValues,
} from "./key-settings-form";
import { KeySettingsFields } from "./KeySettingsFields";
import type { KeyWorkflowAction } from "./key-workflow-reducer";

type EditKeyDialogProps = {
  keyRecord: ApiKey;
  dispatch: React.Dispatch<KeyWorkflowAction>;
};

class PartialKeySaveError extends Error {}

export function EditKeyDialog({ keyRecord, dispatch }: EditKeyDialogProps) {
  const queryClient = useQueryClient();
  const [showDiscard, setShowDiscard] = useState(false);
  const defaultValues: KeySettingsValues = {
    name: keyRecord.name,
    scopes: keyRecord.scopes,
    spendLimit: keyRecord.spend_limit_usd?.toString() ?? "",
    alertThresholds: [],
  };

  const form = useForm<KeySettingsValues>({
    resolver: zodResolver(keySettingsSchema),
    defaultValues,
  });
  const updateMutation = useMutation({
    mutationFn: async ({
      keyInput,
      thresholds,
      monthlyLimitUsd,
    }: {
      keyInput: UpdateApiKeyInput;
      thresholds: number[];
      monthlyLimitUsd: number;
    }) => {
      const updated = Object.keys(keyInput).length > 0
        ? await updateApiKey(keyRecord.id, keyInput)
        : keyRecord;

      if (thresholds.length > 0) {
        try {
          await createSpendLimit({
            scope: "api_key",
            api_key_id: keyRecord.id,
            monthly_limit_usd: monthlyLimitUsd,
            alert_thresholds_pct: thresholds,
          });
        } catch {
          await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeysRoot });
          throw new PartialKeySaveError(
            "The alert thresholds weren’t saved. Any other key changes were saved. Retry Save changes to apply the thresholds.",
          );
        }
      }

      return updated;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeysRoot });
      dispatch({ type: "EDIT_COMPLETE" });
    },
  });

  function requestClose() {
    if (updateMutation.isPending) return;
    if (form.formState.isDirty) setShowDiscard(true);
    else dispatch({ type: "CANCEL_EDIT" });
  }

  function resetChanges() {
    form.reset(defaultValues);
    updateMutation.reset();
  }

  function submit(values: KeySettingsValues) {
    if (keyRecord.spend_limit_usd !== null && values.spendLimit === "") {
      form.setError("spendLimit", {
        message: "Removing an existing cap is not supported by the current API.",
      });
      return;
    }

    const input: UpdateApiKeyInput = {};
    if (form.formState.dirtyFields.name) input.name = values.name;
    if (form.formState.dirtyFields.scopes) input.scopes = values.scopes;
    if (form.formState.dirtyFields.spendLimit && values.spendLimit) {
      input.spend_limit_usd = Number(values.spendLimit);
    }

    if (Object.keys(input).length === 0 && values.alertThresholds.length === 0) {
      dispatch({ type: "CANCEL_EDIT" });
      return;
    }

    updateMutation.mutate({
      keyInput: input,
      thresholds: values.alertThresholds,
      monthlyLimitUsd: Number(values.spendLimit),
    });
  }

  return (
    <>
      <Dialog.Root open onOpenChange={(open) => !open && requestClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className={dialogStyles.overlay} />
          <Dialog.Content className={`${dialogStyles.content} ${dialogStyles.wide}`} aria-describedby="edit-key-description">
            <div className={dialogStyles.heading}>
              <div>
                <Dialog.Title>Edit API key</Dialog.Title>
                <Dialog.Description id="edit-key-description" className={dialogStyles.description}>
                  Update settings for <strong>{keyRecord.name}</strong>. The secret will not change.
                </Dialog.Description>
              </div>
              <IconButton label="Close" icon={<X size={18} />} onClick={requestClose} />
            </div>

            <form className={dialogStyles.formStack} onSubmit={form.handleSubmit(submit)}>
              <KeySettingsFields
                form={form}
                alertThresholdHelperText="Saved thresholds are not returned by the current API. Select values to replace them; leave blank to keep existing settings."
              />

              {updateMutation.isError && updateMutation.error instanceof PartialKeySaveError && (
                <WarningNotice
                  title="Some settings weren’t saved"
                  messages={[updateMutation.error.message]}
                />
              )}

              {updateMutation.isError && !(updateMutation.error instanceof PartialKeySaveError) && (
                <div className="inline-error" role="alert">
                  {updateMutation.error.message}
                </div>
              )}

              <div className={`${dialogStyles.actions} ${dialogStyles.splitActions}`}>
                <Button
                  variant="ghost"
                  disabled={!form.formState.isDirty || updateMutation.isPending}
                  onClick={resetChanges}
                >
                  Reset changes
                </Button>
                <div className={dialogStyles.actionGroup}>
                  <Button onClick={requestClose} disabled={updateMutation.isPending}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={updateMutation.isPending}
                    loadingLabel="Saving API key"
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <DiscardChangesDialog
        open={showDiscard}
        onKeepEditing={() => setShowDiscard(false)}
        onDiscard={() => dispatch({ type: "CANCEL_EDIT" })}
      />
    </>
  );
}
