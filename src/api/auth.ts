import { authRoutes } from "./routes";

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

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
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

type ApiError = {
  code: number;
  message: string;
};

async function parseJsonSafely(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function handleResponse<T>(res: Response): Promise<ApiEnvelope<T>> {
  const json = await parseJsonSafely(res);

  if (!res.ok) {
    const message =
      json?.message ??
      json?.error ??
      "Something went wrong. Please try again.";

    throw {
      code: res.status,
      message,
    } as ApiError;
  }

  return json as ApiEnvelope<T>;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<ApiEnvelope<RegisterData>> {
  const res = await fetch(authRoutes.register, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<RegisterData>(res);
}

export async function verifyEmail(
  payload: VerifyEmailPayload
): Promise<ApiEnvelope<null>> {
  const res = await fetch(authRoutes.verifyEmail, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      token: payload.verificationCode,
    }),
  });

  return handleResponse<null>(res);
}

export async function resendVerification(
  payload: ResendVerificationPayload
): Promise<ApiEnvelope<null>> {
  const res = await fetch(authRoutes.resendVerification, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<null>(res);
}

export async function loginUser(
  payload: LoginPayload
): Promise<ApiEnvelope<LoginData>> {
  const res = await fetch(authRoutes.login, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<LoginData>(res);
}

export async function logoutUser(): Promise<ApiEnvelope<null>> {
  const res = await fetch(authRoutes.logout, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<null>(res);
}

export async function getSessionUser(): Promise<ApiEnvelope<{ user: unknown }>> {
  const res = await fetch(authRoutes.protected, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<{ user: unknown }>(res);
}