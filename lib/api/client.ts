import { ApiError } from "./errors";
import type { ApiResponse, Pagination } from "./types";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeoutMs?: number;
}

export interface ClientResponse<T> {
  data: T;
  pagination?: Pagination;
  rawResponse: Response;
}

const DEFAULT_TIMEOUT_MS = 15000;

export function getBaseApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return url.replace(/\/+$/, "");
}

/**
 * Normalizes query parameters into a URLSearchParams string.
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

/**
 * Core HTTP client wrapper enforcing credentials: "include", consistent JSON parsing,
 * request timeouts, and canonical ApiError encapsulation.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ClientResponse<T>> {
  const { params, body, timeoutMs = DEFAULT_TIMEOUT_MS, headers: customHeaders, ...fetchOptions } = options;

  const baseUrl = getBaseApiUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const queryString = buildQueryString(params);
  const fullUrl = `${baseUrl}${cleanEndpoint}${queryString}`;

  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let serializedBody: string | undefined;
  if (body !== undefined && body !== null) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    serializedBody = typeof body === "string" ? body : JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      body: serializedBody,
      credentials: "include", // Essential for HttpOnly session cookies
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        `Request to ${cleanEndpoint} timed out after ${timeoutMs}ms`,
        0,
        "timeout",
      );
    }
    throw ApiError.networkError(err instanceof Error ? err : undefined);
  } finally {
    clearTimeout(timeoutId);
  }

  const reqId = response.headers.get("X-Request-ID");

  // Read response body as text first to handle both JSON and non-JSON cleanly
  let responseData: unknown = null;
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (rawText && contentType.includes("application/json")) {
    try {
      responseData = JSON.parse(rawText);
    } catch {
      responseData = rawText;
    }
  } else if (rawText) {
    responseData = rawText;
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, responseData, reqId);
  }

  // Handle standard Cafnet envelope: { data: T, pagination?: Pagination }
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    const envelope = responseData as ApiResponse<T>;
    return {
      data: envelope.data,
      pagination: envelope.pagination,
      rawResponse: response,
    };
  }

  // Fallback if data is already the root payload
  return {
    data: responseData as T,
    rawResponse: response,
  };
}

export const api = {
  get<T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">): Promise<ClientResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<ClientResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: "POST", body });
  },

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<ClientResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: "PUT", body });
  },

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<ClientResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: "PATCH", body });
  },

  delete<T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">): Promise<ClientResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: "DELETE" });
  },
};
