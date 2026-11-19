import { Button } from "../../components/ui/Button/Button";
import styles from "./UsageSupportNotice.module.css";

export type UsageSupportFailure = {
  id: string;
  label: string;
  onRetry: () => void;
};

export function UsageSupportNotice({ failures }: { failures: UsageSupportFailure[] }) {
  if (failures.length === 0) return null;

  return (
    <div className={`inline-error ${styles.notice}`} role="status">
      <div>
        <strong>Some usage data couldn’t load.</strong>
        <span>Unavailable: {failures.map((failure) => failure.label).join(", ")}.</span>
      </div>
      <div className={styles.actions}>
        {failures.map((failure) => (
          <Button key={failure.id} size="compact" onClick={failure.onRetry}>
            Retry {failure.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
