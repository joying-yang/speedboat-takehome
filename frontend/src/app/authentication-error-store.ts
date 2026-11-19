export type AuthenticationFailure = {
  status: number;
  type?: string;
};

let currentFailure: AuthenticationFailure | null = null;
const listeners = new Set<() => void>();

export function reportAuthenticationFailure(error: AuthenticationFailure) {
  if (error.status !== 401 && error.type !== "unauthorized") return;
  if (currentFailure) return;

  currentFailure = error;
  listeners.forEach((listener) => listener());
}

export function clearAuthenticationFailure() {
  if (!currentFailure) return;

  currentFailure = null;
  listeners.forEach((listener) => listener());
}

export function subscribeToAuthenticationFailure(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthenticationFailure() {
  return currentFailure;
}
