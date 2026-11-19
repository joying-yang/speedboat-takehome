import { useEffect } from "react";

type SetAlertThresholds = (
  name: "alertThresholds",
  value: number[],
  options: { shouldDirty: boolean; shouldValidate: boolean },
) => void;

export function hasValidSpendLimit(value: string) {
  const normalized = value.trim();
  return normalized !== "" && Number.isFinite(Number(normalized)) && Number(normalized) > 0;
}

export function getAlertThresholdChanges(current: number[], baseline: number[]) {
  const currentSet = new Set(current);
  const baselineSet = new Set(baseline);

  return {
    added: [...currentSet].filter((threshold) => !baselineSet.has(threshold)).sort((a, b) => a - b),
    removed: [...baselineSet].filter((threshold) => !currentSet.has(threshold)).sort((a, b) => a - b),
  };
}

export function useClearInvalidAlertThresholds(
  spendLimit: string,
  alertThresholds: number[],
  setValue: SetAlertThresholds,
) {
  useEffect(() => {
    if (hasValidSpendLimit(spendLimit) || alertThresholds.length === 0) return;

    setValue("alertThresholds", [], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [alertThresholds.length, setValue, spendLimit]);
}
