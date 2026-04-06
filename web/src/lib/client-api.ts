export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  token?: string | null;
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  });

  const payload =
    response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : null;

  if (!response.ok) {
    throw new ApiClientError(
      payload?.error ?? "Request failed",
      response.status,
      payload?.details,
    );
  }

  return payload as T;
}
