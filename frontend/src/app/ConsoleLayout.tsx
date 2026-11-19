import { KeyRound, LineChart } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { AuthenticationBoundary } from "./AuthenticationBoundary";
import styles from "./ConsoleLayout.module.css";

export function ConsoleLayout() {
  return (
    <div>
      <header className={styles.appHeader}>
        <a className={styles.brand} href="/console/keys" aria-label="Parasail console home">
          <span className={styles.brandMark} aria-hidden="true" />
          <span>Parasail</span>
        </a>
        <span className={styles.environmentLabel}>Developer console</span>
      </header>

      <main className={styles.pageShell}>
        <AuthenticationBoundary>
          <>
            <div className={styles.pageHeading}>
              <div>
                <p className={styles.eyebrow}>API console</p>
                <h1>Keys and usage</h1>
              </div>
              <nav className={styles.sectionNav} aria-label="API console sections">
                <NavLink
                  to="/console/keys"
                  className={({ isActive }) => isActive ? styles.active : undefined}
                >
                  <KeyRound size={16} aria-hidden="true" />
                  API keys
                </NavLink>
                <NavLink
                  to="/console/usage"
                  className={({ isActive }) => isActive ? styles.active : undefined}
                >
                  <LineChart size={16} aria-hidden="true" />
                  Usage
                </NavLink>
              </nav>
            </div>
            <Outlet />
          </>
        </AuthenticationBoundary>
      </main>
    </div>
  );
}
