import { useWatch, type UseFormReturn } from "react-hook-form";
import { TextField } from "../../components/ui/TextField/TextField";
import { AlertThresholdFields } from "../spend-limits/AlertThresholdFields";
import { SpendLimitSaveNotice } from "../spend-limits/SpendLimitSaveNotice";
import {
  hasValidSpendLimit,
  useClearInvalidAlertThresholds,
} from "../spend-limits/spend-limit-form";
import { ScopePicker } from "./ScopePicker";
import type { KeySettingsValues } from "./key-settings-form";

type KeySettingsFieldsProps = {
  form: UseFormReturn<KeySettingsValues>;
  namePlaceholder?: string;
  alertThresholdHelperText: string;
};

export function KeySettingsFields({
  form,
  namePlaceholder,
  alertThresholdHelperText,
}: KeySettingsFieldsProps) {
  const scopes = useWatch({ control: form.control, name: "scopes" });
  const spendLimit = useWatch({ control: form.control, name: "spendLimit" });
  const alertThresholds = useWatch({ control: form.control, name: "alertThresholds" });
  const hasSpendLimit = hasValidSpendLimit(spendLimit);
  useClearInvalidAlertThresholds(spendLimit, alertThresholds, form.setValue);

  return (
    <>
      <TextField
        label="Key name"
        placeholder={namePlaceholder}
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />

      <ScopePicker
        value={scopes}
        error={form.formState.errors.scopes?.message}
        onChange={(value) => {
          form.setValue("scopes", value, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
      />

      <TextField
        label="Monthly cap"
        optional
        prefix="$"
        inputMode="decimal"
        placeholder="No limit"
        helperText="Usage resets on the first of each month."
        error={form.formState.errors.spendLimit?.message}
        {...form.register("spendLimit")}
      />

      <AlertThresholdFields
        value={alertThresholds}
        disabled={!hasSpendLimit}
        error={form.formState.errors.alertThresholds?.message}
        helperText={alertThresholdHelperText}
        onChange={(value) => {
          form.setValue("alertThresholds", value, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
      />

      <SpendLimitSaveNotice
        monthlyLimit={spendLimit}
        monthlyLimitChanged={Boolean(form.formState.dirtyFields.spendLimit)}
        thresholds={alertThresholds}
        thresholdMode={{ kind: "set" }}
      />
    </>
  );
}
