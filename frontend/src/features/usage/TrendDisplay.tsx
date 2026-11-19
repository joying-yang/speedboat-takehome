import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import styles from "./UsagePage.module.css";

const percentChange = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

type TrendDisplayProps = {
  trendRatio: number | null;
  isLoading: boolean;
  isError: boolean;
};

export function TrendDisplay({ trendRatio, isLoading, isError }: TrendDisplayProps) {
  if (isLoading) {
    return <span className={`${styles.trend} ${styles.unavailable}`}>Comparing…</span>;
  }

  if (isError) {
    return <span className={`${styles.trend} ${styles.unavailable}`}>Comparison unavailable</span>;
  }

  if (trendRatio === null) {
    return <span className={`${styles.trend} ${styles.unavailable}`}>No prior data</span>;
  }

  const TrendIcon = trendRatio > 0 ? TrendingUp : trendRatio < 0 ? TrendingDown : Minus;
  const direction = trendRatio > 0 ? "increase" : trendRatio < 0 ? "decrease" : "no change";

  return (
    <span
      className={styles.trend}
      aria-label={`${percentChange.format(Math.abs(trendRatio))} ${direction} compared with the previous period`}
    >
      <TrendIcon aria-hidden="true" />
      <strong>{percentChange.format(trendRatio)}</strong>
      <span>vs previous period</span>
    </span>
  );
}
