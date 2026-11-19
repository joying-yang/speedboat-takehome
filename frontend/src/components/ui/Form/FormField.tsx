import { useId, type ReactNode } from "react";
import styles from "./Form.module.css";

type FormFieldControl = {
  controlId: string;
  messageId: string | undefined;
  invalid: boolean;
};

type FormFieldProps = {
  id?: string;
  label: string;
  optional?: boolean;
  helperText?: string;
  error?: string;
  children: (control: FormFieldControl) => ReactNode;
};

export function FormField({
  id,
  label,
  optional = false,
  helperText,
  error,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const messageId = error || helperText ? `${controlId}-message` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
        {optional && <span className={styles.optional}>Optional</span>}
      </label>
      {children({ controlId, messageId, invalid: Boolean(error) })}
      {messageId && (
        <span
          id={messageId}
          className={error ? styles.error : styles.helper}
          role={error ? "alert" : undefined}
        >
          {error ?? helperText}
        </span>
      )}
    </div>
  );
}
