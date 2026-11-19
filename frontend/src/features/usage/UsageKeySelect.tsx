import type { ApiKey } from "../../api/types";
import { Select } from "../../components/ui/Select/Select";

type UsageKeySelectProps = {
  keys?: ApiKey[];
  value?: string;
  isPending: boolean;
  isError: boolean;
  onChange: (value: string) => void;
};

export function UsageKeySelect({
  keys,
  value,
  isPending,
  isError,
  onChange,
}: UsageKeySelectProps) {
  const activeKeys = keys?.filter((key) => key.revoked_at === null) ?? [];
  const revokedKeys = keys?.filter((key) => key.revoked_at !== null) ?? [];
  const selectedKeyIsMissing = Boolean(value && !keys?.some((key) => key.id === value));

  return (
    <Select
      label="API key"
      value={value ?? "all"}
      disabled={isPending || isError}
      helperText={isPending ? "Loading API keys…" : undefined}
      error={isError ? "API-key filters unavailable. Use retry below." : undefined}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="all">All API keys</option>
      {selectedKeyIsMissing && <option value={value}>{value}</option>}
      {activeKeys.length > 0 && (
        <optgroup label="Active keys">
          {activeKeys.map((key) => <option key={key.id} value={key.id}>{key.name}</option>)}
        </optgroup>
      )}
      {revokedKeys.length > 0 && (
        <optgroup label="Revoked keys">
          {revokedKeys.map((key) => (
            <option key={key.id} value={key.id}>{key.name} (revoked)</option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}
