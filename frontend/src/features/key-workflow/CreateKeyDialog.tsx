import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createApiKey } from "../../api/api-keys";
import { queryKeys } from "../../api/query-keys";
import { createSpendLimit } from "../../api/spend-limits";
import { Button } from "../../components/ui/Button/Button";
import dialogStyles from "../../components/ui/Dialog/Dialog.module.css";
import { IconButton } from "../../components/ui/IconButton/IconButton";
import { defaultApiScopes } from "../../domain/api-scopes";
import {
  keySettingsSchema,
  type KeySettingsValues,
} from "./key-settings-form";
import { KeySettingsFields } from "./KeySettingsFields";
import type { KeyWorkflowAction } from "./key-workflow-reducer";

type CreateKeyDialogProps = {
  dispatch: React.Dispatch<KeyWorkflowAction>;
};

export function CreateKeyDialog({ dispatch }: CreateKeyDialogProps) {
  const queryClient = useQueryClient();
  const [requestError, setRequestError] = useState<string | null>(null);
  const form = useForm<KeySettingsValues>({
    resolver: zodResolver(keySettingsSchema),
    defaultValues: {
      name: "",
      scopes: defaultApiScopes,
      spendLimit: "",
      alertThresholds: [],
    },
  });
  async function submit(values: KeySettingsValues) {
    setRequestError(null);

    try {
      // This intentionally bypasses useMutation: a successful mutation is
      // retained in TanStack Query's mutation cache, but this response contains
      // a one-time secret. Keep it only in the short-lived workflow state.
      const created = await createApiKey({
        name: values.name,
        scopes: values.scopes,
        spend_limit_usd: values.spendLimit ? Number(values.spendLimit) : null,
      });

      let alertNotice: string | undefined;
      if (values.spendLimit && values.alertThresholds.length > 0) {
        try {
          await createSpendLimit({
            scope: "api_key",
            api_key_id: created.id,
            monthly_limit_usd: Number(values.spendLimit),
            alert_thresholds_pct: values.alertThresholds,
          });
        } catch {
          alertNotice = "The alert thresholds weren’t saved. The API key and monthly cap were saved. Store the key, then retry the thresholds from Edit key.";
        }
      }

      dispatch({
        type: "KEY_CREATED",
        keyName: created.name,
        secret: created.secret,
        notice: alertNotice,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeysRoot });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Could not create the key.");
    }
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !form.formState.isSubmitting) dispatch({ type: "CANCEL" });
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={dialogStyles.overlay} />
        <Dialog.Content className={`${dialogStyles.content} ${dialogStyles.wide}`} aria-describedby="create-key-description">
          <div className={dialogStyles.heading}>
            <div>
              <Dialog.Title>Create API key</Dialog.Title>
              <Dialog.Description id="create-key-description" className={dialogStyles.description}>
                Choose the narrowest access this workload needs.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close" icon={<X size={18} />} />
            </Dialog.Close>
          </div>

          <form className={dialogStyles.formStack} onSubmit={form.handleSubmit(submit)}>
            <KeySettingsFields
              form={form}
              namePlaceholder="Production chatbot"
              alertThresholdHelperText="Choose when alerts trigger. Delivery destination is not yet defined."
            />

            {requestError && <div className="inline-error" role="alert">{requestError}</div>}

            <div className={dialogStyles.actions}>
              <Button onClick={() => dispatch({ type: "CANCEL" })}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={form.formState.isSubmitting}
                loadingLabel="Creating API key"
              >
                Create key
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
