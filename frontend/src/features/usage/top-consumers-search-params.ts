export const defaultTopConsumerPageSize = 10;

export function readTopConsumerPage(value: string | null) {
  if (!value) return 1;

  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
