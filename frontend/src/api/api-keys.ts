import { apiRequest } from "./client";
import type {
  ApiKey,
  CreatedApiKey,
  CreateApiKeyInput,
  ListResponse,
  UpdateApiKeyInput,
} from "./types";

export function listApiKeys(includeRevoked = true) {
  const query = new URLSearchParams({
    include_revoked: String(includeRevoked),
  });
  return apiRequest<ListResponse<ApiKey>>(`/v1/api-keys?${query}`);
}

export function createApiKey(input: CreateApiKeyInput) {
  return apiRequest<CreatedApiKey>("/v1/api-keys", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateApiKey(keyId: string, input: UpdateApiKeyInput) {
  return apiRequest<ApiKey>(`/v1/api-keys/${keyId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function revokeApiKey(keyId: string) {
  return apiRequest<ApiKey>(`/v1/api-keys/${keyId}`, {
    method: "DELETE",
  });
}
