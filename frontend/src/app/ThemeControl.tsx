import { SunMoon } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./ConsoleLayout.module.css";

type ThemePreference = "system" | "light" | "dark";

const themeStorageKey = "parasail-console-theme";

function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function ThemeControl() {
  const [theme, setTheme] = useState<ThemePreference>(readThemePreference);

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = theme;

    try {
      if (theme === "system") localStorage.removeItem(themeStorageKey);
      else localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Theme selection still works for this page when storage is unavailable.
    }
  }, [theme]);

  return (
    <label className={styles.themeControl}>
      <SunMoon size={16} aria-hidden="true" />
      <span className="sr-only">Color theme</span>
      <select
        className={styles.themeSelect}
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemePreference)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
