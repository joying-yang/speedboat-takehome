import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./IconButton.module.css";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  icon: ReactNode;
  variant?: "secondary" | "ghost" | "dangerGhost";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, icon, variant = "secondary", className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
        aria-label={label}
      >
        {icon}
      </button>
    );
  },
);
