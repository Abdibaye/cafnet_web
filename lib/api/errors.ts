import type { ApiErrorDetail, ApiErrorResponse } from "./types";

/**
 * ApiError represents a typed, machine-readable HTTP or application error
 * originating from the Cafnet Go backend or client-side transport.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number = 500,
    code: string = "internal_server_error",
    requestId?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  isNetworkError(): boolean {
    return this.status === 0 || this.code === "network_error";
  }

  isUnauthorized(): boolean {
    return this.status === 401 || this.code === "unauthenticated" || this.code === "session_expired";
  }

  isForbidden(): boolean {
    return this.status === 403 || this.code === "forbidden" || this.code === "not_business_manager";
  }

  isNotFound(): boolean {
    return this.status === 404 || this.code === "resource_not_found";
  }

  isConflict(): boolean {
    return this.status === 409 || this.code === "conflict" || this.code === "illegal_state_transition";
  }

  isRateLimited(): boolean {
    return this.status === 429 || this.code === "rate_limited" || this.code === "otp_too_many_attempts";
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  static fromResponse(
    status: number,
    data: unknown,
    headerRequestId?: string | null,
  ): ApiError {
    const errorEnvelope = data as Partial<ApiErrorResponse> | undefined;
    const detail = errorEnvelope?.error as Partial<ApiErrorDetail> | undefined;

    const message =
      detail?.message ||
      (typeof data === "string" && data.length > 0 ? data : `Request failed with status ${status}`);
    const code = detail?.code || (status === 0 ? "network_error" : "error");
    const reqId = detail?.request_id || headerRequestId || undefined;

    return new ApiError(message, status, code, reqId, detail?.details);
  }

  static networkError(originalError?: Error): ApiError {
    return new ApiError(
      originalError?.message || "Failed to connect to Cafnet servers. Please check your internet connection.",
      0,
      "network_error",
      undefined,
      originalError,
    );
  }
}
