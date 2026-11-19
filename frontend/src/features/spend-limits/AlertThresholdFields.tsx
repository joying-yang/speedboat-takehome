import { useId } from "react";
import formStyles from "../../components/ui/Form/Form.module.css";
import styles from "./AlertThresholdFields.module.css";

const supportedThresholds = [50, 80, 100] as const;

type AlertThresholdFieldsProps = {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
  helperText: string;
  error?: string;
};

export function AlertThresholdFields({
  value,
  onChange,
  disabled = false,
  helperText,
  error,
}: AlertThresholdFieldsProps) {
  const helperId = useId();

  function toggle(threshold: number) {
    const next = value.includes(threshold)
      ? value.filter((item) => item !== threshold)
      : [...value, threshold].sort((first, second) => first - second);
    onChange(next);
  }

  return (
    <fieldset
      className={`${formStyles.field} ${formStyles.fieldsetReset} ${styles.thresholdField}`}
      disabled={disabled}
      aria-describedby={helperId}
    >
      <legend>
        Alert thresholds
        <span className={formStyles.optional}>Optional</span>
      </legend>
      <span
        id={helperId}
        className={`${error ? formStyles.error : formStyles.helper} ${styles.helper}`}
        role={error ? "alert" : undefined}
      >
        {error ?? helperText}
      </span>
      <div className={styles.grid}>
        {supportedThresholds.map((threshold) => (
          <label className={styles.option} key={threshold}>
            <input
              type="checkbox"
              checked={value.includes(threshold)}
              onChange={() => toggle(threshold)}
            />
            <span className={styles.copy}>
              <strong>{threshold}%</strong>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
