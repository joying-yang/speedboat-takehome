export type GranularApiScope =
  | "inference:read"
  | "inference:write"
  | "deployments:read"
  | "deployments:write"
  | "billing:read"
  | "billing:write";

export type ApiScope = GranularApiScope | "admin";

export const apiScopeGroups: Array<{
  id: "inference" | "deployments" | "billing";
  label: string;
  description: string;
  read: GranularApiScope;
  write: GranularApiScope;
}> = [
  {
    id: "inference",
    label: "Inference",
    description: "Models and requests",
    read: "inference:read",
    write: "inference:write",
  },
  {
    id: "deployments",
    label: "Deployments",
    description: "Hosted endpoints",
    read: "deployments:read",
    write: "deployments:write",
  },
  {
    id: "billing",
    label: "Billing",
    description: "Usage and invoices",
    read: "billing:read",
    write: "billing:write",
  },
];

export const defaultApiScopes: ApiScope[] = ["inference:read", "inference:write"];

const scopeOrder: ApiScope[] = [
  "inference:read",
  "inference:write",
  "deployments:read",
  "deployments:write",
  "billing:read",
  "billing:write",
  "admin",
];

export function sortApiScopes(scopes: string[]) {
  return [...scopes].sort((first, second) => {
    const firstIndex = scopeOrder.indexOf(first as ApiScope);
    const secondIndex = scopeOrder.indexOf(second as ApiScope);
    return (firstIndex === -1 ? scopeOrder.length : firstIndex)
      - (secondIndex === -1 ? scopeOrder.length : secondIndex);
  });
}
