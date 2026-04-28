import { authRoutes } from "./routes";
import { handleEnvelope, jsonHeaders, type ApiEnvelope } from "./client";
import { getProfileStatus } from "./profileApi";

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  verificationCode: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterData {
  user_id: number;
  email: string;
  verified: boolean;
  account_status: string;
}

export interface LoginData {
  user: {
    user_id: number;
    email: string;
    verified: boolean;
  };
}

export async function registerUser(
  payload: RegisterPayload
): Promise<ApiEnvelope<RegisterData>> {
  const res = await fetch(authRoutes.register, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return handleEnvelope<RegisterData>(res);
}

export async function verifyEmail(
  payload: VerifyEmailPayload
): Promise<ApiEnvelope<null>> {
  const res = await fetch(authRoutes.verifyEmail, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({
      email: payload.email,
      token: payload.verificationCode,
    }),
  });

  return handleEnvelope<null>(res);
}

export async function resendVerification(
  payload: ResendVerificationPayload
): Promise<ApiEnvelope<null>> {
  const res = await fetch(authRoutes.resendVerification, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return handleEnvelope<null>(res);
}

export async function loginUser(
  payload: LoginPayload
): Promise<ApiEnvelope<LoginData>> {
  const res = await fetch(authRoutes.login, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return handleEnvelope<LoginData>(res);
}

export async function logoutUser(): Promise<ApiEnvelope<null>> {
  const res = await fetch(authRoutes.logout, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
  });

  return handleEnvelope<null>(res);
}

export async function getSessionUser(): Promise<ApiEnvelope<{ user: unknown }>> {
  const res = await fetch(authRoutes.protected, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
  });

  return handleEnvelope<{ user: unknown }>(res);
}

export { getProfileStatus };
