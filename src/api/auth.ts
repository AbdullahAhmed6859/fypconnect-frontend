const BASE_URL = "http://localhost:5000/api/v1";

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  data?: {
    user_id?: number;
    email?: string;
    verified?: boolean;
    account_status?: string;
  };
}

export interface VerifyEmailPayload {
  email: string;
  verificationCode: string;
}

export interface VerifyEmailResponse {
  message: string;
  data?: unknown;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: {
      user_id: number;
      email: string;
      verified: boolean;
    };
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw { code: res.status, message: json.message ?? "Something went wrong." };
  }
  return json as T;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
  const res = await fetch(`${BASE_URL}/auth/verify-email`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      token: payload.verificationCode,
    }),
  });
  return handleResponse<VerifyEmailResponse>(res);
}

export async function resendVerification(
  payload: ResendVerificationPayload
): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/auth/resend-verification`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(res);
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<LoginResponse>(res);
}