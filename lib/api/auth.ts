import { api } from "./client";
import { ApiError } from "./errors";
import type {
  AuthResult,
  LogoutResult,
  OTPRequestResult,
  RequestOTPInput,
  User,
  VerifyOTPInput,
} from "./types";

/**
 * Initiates an OTP phone verification challenge.
 * In dev mode, the backend returns dev_otp for rapid local testing.
 */
export async function requestOtp(phone: string): Promise<OTPRequestResult> {
  const payload: RequestOTPInput = { phone };
  const res = await api.post<OTPRequestResult>("/api/v1/auth/otp/request", payload);
  return res.data;
}

/**
 * Verifies an OTP challenge code. The Go server issues an HTTP-only secure cookie
 * upon successful verification and returns user details.
 */
export async function verifyOtp(
  challengeId: string,
  phone: string,
  otpCode: string,
): Promise<AuthResult> {
  const payload: VerifyOTPInput = {
    challenge_id: challengeId,
    phone,
    otp_code: otpCode,
  };
  const res = await api.post<AuthResult>("/api/v1/auth/otp/verify", payload);
  return res.data;
}

/**
 * Revokes the server-side session in PostgreSQL and invalidates the client cookie.
 */
export async function logout(): Promise<LogoutResult> {
  const res = await api.post<LogoutResult>("/api/v1/auth/logout");
  return res.data;
}

/**
 * Fetches the currently authenticated user identity.
 * Returns null if the user is unauthenticated or the session has expired.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await api.get<User>("/api/v1/auth/me");
    return res.data;
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.isUnauthorized() || err.status === 401)) {
      return null;
    }
    // Re-throw genuine network or server errors
    throw err;
  }
}
