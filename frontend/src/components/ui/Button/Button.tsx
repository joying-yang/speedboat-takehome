import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "compact" | "default" | "large";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "default",
    loading = false,
    loadingLabel = "Loading",
    leadingIcon,
    className,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <span className={styles.content} aria-hidden={loading || undefined}>
        {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
        {children}
      </span>
      {loading && (
        <span className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      )}
    </button>
  );
});
