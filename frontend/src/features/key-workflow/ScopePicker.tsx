import { useId } from "react";
import formStyles from "../../components/ui/Form/Form.module.css";
import { apiScopeGroups, sortApiScopes, type ApiScope } from "../../domain/api-scopes";
import styles from "./ScopePicker.module.css";

type ScopePickerProps = {
  value: string[];
  onChange: (value: ApiScope[]) => void;
  error?: string;
};

export function ScopePicker({ value, onChange, error }: ScopePickerProps) {
  const descriptionId = useId();
  const messageId = useId();
  const adminSelected = value.includes("admin");

  function toggleScope(scope: ApiScope, checked: boolean) {
    if (scope === "admin") {
      onChange(checked ? ["admin"] : []);
      return;
    }

    const withoutAdmin = value.filter((item) => item !== "admin");
    const next = checked
      ? [...withoutAdmin, scope]
      : withoutAdmin.filter((item) => item !== scope);
    onChange(sortApiScopes(next) as ApiScope[]);
  }

  return (
    <fieldset
      className={`${formStyles.field} ${formStyles.fieldsetReset}`}
      aria-describedby={`${descriptionId} ${messageId}`}
    >
      <legend>Access scopes</legend>
      <span id={descriptionId} className={formStyles.helper}>
        Select only what this key needs. Read and write can be combined across areas.
      </span>

      <div className={styles.matrixShell}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <th><span className="sr-only">Access area</span></th>
              <th scope="col">Read</th>
              <th scope="col">Write</th>
            </tr>
          </thead>
          <tbody>
            {apiScopeGroups.map((group) => (
              <tr key={group.id}>
                <th className={styles.rowHeading} scope="row">
                  <strong>{group.label}</strong>
                  <span>{group.description}</span>
                </th>
                <td>
                  <label className={styles.matrixOption}>
                    <input
                      type="checkbox"
                      aria-label={`${group.label} read — ${group.read}`}
                      checked={value.includes(group.read)}
                      disabled={adminSelected}
                      onChange={(event) => toggleScope(group.read, event.target.checked)}
                    />
                    <code>{group.read}</code>
                  </label>
                </td>
                <td>
                  <label className={styles.matrixOption}>
                    <input
                      type="checkbox"
                      aria-label={`${group.label} write — ${group.write}`}
                      checked={value.includes(group.write)}
                      disabled={adminSelected}
                      onChange={(event) => toggleScope(group.write, event.target.checked)}
                    />
                    <code>{group.write}</code>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className={styles.adminOption}>
        <input
          type="checkbox"
          checked={adminSelected}
          onChange={(event) => toggleScope("admin", event.target.checked)}
        />
        <span>
          <strong>Administrator access</strong>
          <small>Broad account access for trusted tooling. Selecting it replaces resource scopes.</small>
          <code>admin</code>
        </span>
      </label>

      <span id={messageId} className={error ? formStyles.error : formStyles.helper} role={error ? "alert" : undefined}>
        {error ?? "At least one scope is required."}
      </span>
    </fieldset>
  );
}
