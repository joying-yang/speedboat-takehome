import type { KeyRowViewModel } from "./key-row-view-model";
import { formatUsd } from "../../utils/formatters";
import styles from "./KeysPage.module.css";

export function KeySpend({ keyRecord }: { keyRecord: KeyRowViewModel }) {
  const detailClasses = [
    styles.spendDetail,
    keyRecord.spendTone === "normal" ? undefined : styles[keyRecord.spendTone],
  ].filter(Boolean).join(" ");

  return (
    <>
      <strong className="type-mono-md">{formatUsd(keyRecord.spend_used_usd)}</strong>
      <span className={detailClasses}>
        {keyRecord.spendPercent === null
          ? "No limit"
          : `${Math.round(keyRecord.spendPercent)}% used`}
      </span>
    </>
  );
}
