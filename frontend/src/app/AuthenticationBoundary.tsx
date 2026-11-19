import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { type ReactNode, useSyncExternalStore } from "react";
import { Button } from "../components/ui/Button/Button";
import {
  clearAuthenticationFailure,
  getAuthenticationFailure,
  subscribeToAuthenticationFailure,
} from "./authentication-error-store";
import styles from "./ConsoleLayout.module.css";

export function AuthenticationBoundary({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const failure = useSyncExternalStore(
    subscribeToAuthenticationFailure,
    getAuthenticationFailure,
    getAuthenticationFailure,
  );

  function retry() {
    clearAuthenticationFailure();
    void queryClient.resetQueries();
  }

  if (!failure) return children;

  return (
    <section
      className={`${styles.authenticationBoundary} state-panel error-state`}
      role="alert"
      aria-labelledby="authentication-error-title"
    >
      <ShieldAlert size={28} aria-hidden="true" />
      <strong id="authentication-error-title">Unable to authenticate</strong>
      <span>
        The configured API credential was rejected. Check the server configuration,
        then try again.
      </span>
      <Button size="compact" onClick={retry}>Try again</Button>
    </section>
  );
}
