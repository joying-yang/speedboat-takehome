export const defaultKeyPageSize = 10;

export type KeyStatusFilter = "all" | "active" | "revoked";

export function readKeyStatus(value: string | null): KeyStatusFilter {
  return value === "active" || value === "revoked" ? value : "all";
}

export function readKeyPage(value: string | null) {
  if (!value) return 1;

  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
