import { reportAuthenticationFailure } from "../app/authentication-error-store";

const API_PREFIX = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly type?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorDetails(payload: unknown): { message?: string; type?: string } {
  if (!payload || typeof payload !== "object") return {};

  const value = payload as Record<string, unknown>;
  const detail = value.detail;
  const candidate =
    detail && typeof detail === "object"
      ? (detail as Record<string, unknown>).error
      : value.error;

  if (!candidate || typeof candidate !== "object") return {};
  const error = candidate as Record<string, unknown>;

  return {
    message: typeof error.message === "string" ? error.message : undefined,
    type: typeof error.type === "string" ? error.type : undefined,
  };
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const details = errorDetails(payload);
    const error = new ApiError(
      details.message ?? `Request failed with status ${response.status}.`,
      response.status,
      details.type,
    );
    reportAuthenticationFailure(error);
    throw error;
  }

  return payload as T;
}
