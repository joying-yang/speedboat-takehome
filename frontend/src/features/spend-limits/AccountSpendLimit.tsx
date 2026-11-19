import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { queryKeys } from "../../api/query-keys";
import { createSpendLimit, type SpendLimit } from "../../api/spend-limits";
import { Button } from "../../components/ui/Button/Button";
import dialogStyles from "../../components/ui/Dialog/Dialog.module.css";
import { IconButton } from "../../components/ui/IconButton/IconButton";
import { TextField } from "../../components/ui/TextField/TextField";
import { formatUsd } from "../../utils/formatters";
import { AlertThresholdFields } from "./AlertThresholdFields";
import { SpendLimitSaveNotice } from "./SpendLimitSaveNotice";
import {
  hasValidSpendLimit,
  useClearInvalidAlertThresholds,
} from "./spend-limit-form";
import styles from "./AccountSpendLimit.module.css";

const accountLimitSchema = z.object({
  monthlyLimit: z
    .string()
    .trim()
    .min(1, "Enter a monthly cap.")
    .refine(
      hasValidSpendLimit,
      "Enter an amount greater than zero.",
    ),
  alertThresholds: z.array(z.number()),
});

type AccountLimitValues = z.infer<typeof accountLimitSchema>;

function valuesFromLimit(limit: SpendLimit | null): AccountLimitValues {
  return {
    monthlyLimit: limit ? String(limit.monthly_limit_usd) : "",
    alertThresholds: limit?.alert_thresholds_pct ?? [],
  };
}

export function AccountSpendLimit() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { data: savedLimit = null } = useQuery<SpendLimit | null>({
    queryKey: queryKeys.accountSpendLimit,
    // The current API cannot read a limit. This disabled query makes the POST
    // response observable across route unmounts without implying persistence
    // across a full page reload.
    queryFn: async () => null,
    enabled: false,
    initialData: null,
    gcTime: Infinity,
  });
  const form = useForm<AccountLimitValues>({
    resolver: zodResolver(accountLimitSchema),
    defaultValues: valuesFromLimit(null),
  });
  const monthlyLimit = useWatch({ control: form.control, name: "monthlyLimit" });
  const alertThresholds = useWatch({ control: form.control, name: "alertThresholds" });
  const hasValidLimit = hasValidSpendLimit(monthlyLimit);
  useClearInvalidAlertThresholds(monthlyLimit, alertThresholds, form.setValue);

  function openDialog() {
    form.reset(valuesFromLimit(savedLimit));
    setRequestError(null);
    setOpen(true);
  }

  async function submit(values: AccountLimitValues) {
    setRequestError(null);

    try {
      const created = await createSpendLimit({
        scope: "account",
        monthly_limit_usd: Number(values.monthlyLimit),
        alert_thresholds_pct: values.alertThresholds,
      });

      queryClient.setQueryData(queryKeys.accountSpendLimit, created);
      setOpen(false);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Could not save the account limit.");
    }
  }

  return (
    <>
      <section className={styles.card} aria-labelledby="account-limit-title">
        <div className={styles.copy}>
          <div className={styles.heading}>
            <h2 id="account-limit-title" className="type-heading-sm">
              Account monthly cap
            </h2>
            {savedLimit && <span className="status-badge active">Saved this session</span>}
          </div>
          {savedLimit ? (
            <>
              <div className={styles.value}>
                <strong className="type-metric">{formatUsd(savedLimit.monthly_limit_usd)}</strong>
                <span>per month</span>
              </div>
              <p>
                {savedLimit.alert_thresholds_pct.length > 0
                  ? `Alerts at ${savedLimit.alert_thresholds_pct.map((threshold) => `${threshold}%`).join(", ")}. `
                  : "No alerts configured. "}
                Resets on the first of each month.
              </p>
            </>
          ) : (
            <p>
              Set a hard ceiling across all API keys. The current setting cannot be loaded until
              the spend-limits API supports reads.
            </p>
          )}
        </div>
        <Button size="compact" onClick={openDialog}>
          {savedLimit ? "Edit limit" : "Set monthly cap"}
        </Button>
      </section>

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) openDialog();
          else setOpen(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={dialogStyles.overlay} />
          <Dialog.Content className={dialogStyles.content} aria-describedby="account-limit-description">
            <div className={dialogStyles.heading}>
              <div>
                <Dialog.Title>{savedLimit ? "Edit account monthly cap" : "Set account monthly cap"}</Dialog.Title>
                <Dialog.Description id="account-limit-description" className={dialogStyles.description}>
                  This hard cap applies to usage across every API key.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <IconButton label="Close" icon={<X size={18} />} />
              </Dialog.Close>
            </div>

            <form className={dialogStyles.formStack} onSubmit={form.handleSubmit(submit)}>
              <TextField
                label="Monthly cap"
                prefix="$"
                inputMode="decimal"
                placeholder="1,000"
                helperText="The billing period resets on the first of each month."
                error={form.formState.errors.monthlyLimit?.message}
                {...form.register("monthlyLimit")}
              />

              <AlertThresholdFields
                value={alertThresholds}
                disabled={!hasValidLimit}
                error={form.formState.errors.alertThresholds?.message}
                helperText="Choose when alerts trigger. Delivery destination is not yet defined."
                onChange={(value) => {
                  form.setValue("alertThresholds", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />

              <SpendLimitSaveNotice
                monthlyLimit={monthlyLimit}
                monthlyLimitChanged={Boolean(form.formState.dirtyFields.monthlyLimit)}
                thresholds={alertThresholds}
                thresholdMode={{
                  kind: "compare",
                  baseline: savedLimit?.alert_thresholds_pct ?? [],
                }}
              />

              {requestError && <div className="inline-error" role="alert">{requestError}</div>}

              <div className={`${dialogStyles.actions} ${dialogStyles.splitActions}`}>
                <Button
                  variant="ghost"
                  disabled={!form.formState.isDirty || form.formState.isSubmitting}
                  onClick={() => form.reset(valuesFromLimit(savedLimit))}
                >
                  Reset changes
                </Button>
                <div className={dialogStyles.actionGroup}>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={form.formState.isSubmitting}
                    loadingLabel="Saving account limit"
                  >
                    Save limit
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
