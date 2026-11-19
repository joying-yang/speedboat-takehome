import type { ReactNode } from "react";
import { Button } from "../Button/Button";

type QueryStatePanelProps = {
  state: "loading" | "error" | "empty";
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function QueryStatePanel({
  state,
  title,
  description,
  icon,
  onRetry,
  retryLabel = "Retry",
  className,
}: QueryStatePanelProps) {
  const classes = [
    "state-panel",
    state === "error" ? "error-state" : undefined,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {icon}
      {state === "loading" ? title : <strong>{title}</strong>}
      {description && <span>{description}</span>}
      {onRetry && (
        <Button size="compact" onClick={onRetry}>{retryLabel}</Button>
      )}
    </div>
  );
}
