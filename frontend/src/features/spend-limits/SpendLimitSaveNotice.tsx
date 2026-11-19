import { WarningNotice } from "../../components/ui/WarningNotice/WarningNotice";
import { formatUsd } from "../../utils/formatters";
import { getAlertThresholdChanges, hasValidSpendLimit } from "./spend-limit-form";

type SpendLimitSaveNoticeProps = {
  monthlyLimit: string;
  monthlyLimitChanged: boolean;
  thresholds: number[];
  thresholdMode: { kind: "set" } | { kind: "compare"; baseline: number[] };
};

function formatThresholds(thresholds: number[]) {
  const labels = thresholds.map((threshold) => `${threshold}%`);
  if (labels.length < 2) return labels[0] ?? "";
  if (labels.length === 2) return labels.join(" and ");
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

export function SpendLimitSaveNotice({
  monthlyLimit,
  monthlyLimitChanged,
  thresholds,
  thresholdMode,
}: SpendLimitSaveNoticeProps) {
  if (!hasValidSpendLimit(monthlyLimit)) return null;

  const messages: string[] = [];
  if (monthlyLimitChanged) {
    messages.push(`Monthly cap will be set to ${formatUsd(Number(monthlyLimit))} per month.`);
  }

  const thresholdsChanged = thresholdMode.kind === "set"
    ? thresholds.length > 0
    : (() => {
        const { added, removed } = getAlertThresholdChanges(thresholds, thresholdMode.baseline);
        return added.length > 0 || removed.length > 0;
      })();

  if (thresholdsChanged) {
    messages.push(
      thresholds.length > 0
        ? `Alert thresholds will be set at ${formatThresholds(thresholds)} of the monthly cap.`
        : "Alert thresholds will be removed.",
    );
  }

  if (messages.length === 0) return null;
  messages.push("New usage may be blocked when the monthly cap is reached.");

  return <WarningNotice title="Review before saving" messages={messages} />;
}
