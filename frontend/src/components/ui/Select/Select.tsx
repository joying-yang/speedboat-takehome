import { forwardRef, type SelectHTMLAttributes } from "react";
import { FormField } from "../Form/FormField";
import styles from "./Select.module.css";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label: string;
  helperText?: string;
  error?: string;
  fieldSize?: "compact" | "default";
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    error,
    fieldSize = "default",
    id,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <FormField id={id} label={label} helperText={helperText} error={error}>
      {({ controlId, messageId, invalid }) => (
        <select
          {...props}
          ref={ref}
          id={controlId}
          className={[
            styles.select,
            styles[fieldSize],
            invalid ? styles.invalid : "",
            className,
          ].filter(Boolean).join(" ")}
          aria-invalid={invalid}
          aria-describedby={messageId}
        >
          {children}
        </select>
      )}
    </FormField>
  );
});
