import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { FormField } from "../Form/FormField";
import styles from "./TextField.module.css";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  optional?: boolean;
  helperText?: string;
  error?: string;
  fieldSize?: "compact" | "default";
  prefix?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      optional = false,
      helperText,
      error,
      fieldSize = "default",
      prefix,
      id,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <FormField
        id={id}
        label={label}
        optional={optional}
        helperText={helperText}
        error={error}
      >
        {({ controlId, messageId, invalid }) => (
          <div
            className={[
              styles.control,
              styles[fieldSize],
              prefix ? styles.withPrefix : "",
              invalid ? styles.invalid : "",
            ].filter(Boolean).join(" ")}
          >
            {prefix && <span className={styles.prefix}>{prefix}</span>}
            <input
              {...props}
              ref={ref}
              id={controlId}
              className={[styles.input, className].filter(Boolean).join(" ")}
              aria-invalid={invalid}
              aria-describedby={messageId}
            />
          </div>
        )}
      </FormField>
    );
  },
);
