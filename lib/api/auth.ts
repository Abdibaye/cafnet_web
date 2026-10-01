import { api } from "./client";
import { ApiError } from "./errors";
import type {
  AuthResult,
  LogoutResult,
  OTPRequestResult,
  RequestOTPInput,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
  User,
  VerifyOTPInput,
} from "./types";

/**
 * Registers a new customer account using Name, Email, and Password.
 * The Go server issues an HTTP-only secure session cookie upon success.
 */
export async function signup(input: SignUpInput): Promise<AuthResult> {
  const res = await api.post<AuthResult>("/api/v1/auth/signup", input);
  return res.data;
}

/**
 * Authenticates a customer using Email and Password.
 * The Go server issues an HTTP-only secure session cookie upon success.
 */
export async function signin(input: SignInInput): Promise<AuthResult> {
  const res = await api.post<AuthResult>("/api/v1/auth/signin", input);
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

/**
 * Updates the authenticated user's profile information (display name, avatar).
 * Authenticated session determines identity (IDOR-safe).
 */
export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const res = await api.patch<User>("/api/v1/account/profile", input);
  return res.data;
}

/**
 * Retrieves the authenticated user's profile from the account endpoint.
 */
export async function getProfile(): Promise<User | null> {
  return getCurrentUser();
}

// ============================================================================
// INACTIVE / LEGACY PHONE OTP AUTHENTICATION
// Retained for backward compatibility and testing only. Not for active UI flow.
// ============================================================================

/**
 * @deprecated Legacy Phone OTP authentication is inactive. Use signup/signin instead.
 */
export async function requestOtp(phone: string): Promise<OTPRequestResult> {
  const payload: RequestOTPInput = { phone };
  const res = await api.post<OTPRequestResult>("/api/v1/auth/otp/request", payload);
  return res.data;
}

/**
 * @deprecated Legacy Phone OTP authentication is inactive. Use signup/signin instead.
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
