import { authRoutes, profileRoutes } from "./routes";

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

export interface MyProfileData {
  profileCompleted: boolean;
  yearOfStudy?: string | number | null;
  annualYearReview?: {
    required: boolean;
    reviewDate: string;
    reviewYear: number;
    dismissedYear?: number | null;
  };
  [key: string]: unknown;
}

export interface ProfileSetupPayload {
  fullName: string;
  yearId: number;
  majorId: number;
  skills: number[];
  interests: number[];
  preferredMajorIds: number[];
  preferredSkillIds: number[];
  preferredInterestIds: number[];
  bio: string | null;
  fypIdea: string | null;
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  projects: {
    project_name: string;
    project_link?: string | null;
  }[];
  profilePicture: string | null;
}

export interface ProfileSetupData {
  message: string;
  data: {
    profileId: number;
    profileCompleted: boolean;
    eligibleForBrowsing: boolean;
  };
}

export interface SetupOption {
  id: number;
  label: string;
  value?: number;
  userCount?: number;
}

interface RawSetupOption {
  id: number;
  label?: string;
  name?: string;
  value?: number;
  userCount?: number;
}

export interface ProfileSetupOptions {
  years: SetupOption[];
  majors: SetupOption[];
  skills: SetupOption[];
  interests: SetupOption[];
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

export async function getMyProfile(): Promise<ApiEnvelope<{ data: MyProfileData }>> {
  const res = await fetch(profileRoutes.me, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<{ data: MyProfileData }>(res);
}

export function unwrapMyProfile(
  envelope: ApiEnvelope<{ data: MyProfileData } | MyProfileData>
): MyProfileData | null {
  const data = envelope.data;
  if (!data) return null;

  if ("profileCompleted" in data) {
    return data;
  }

  return data.data;
}

export async function getProfileStatus(): Promise<{ profileCompleted: boolean }> {
  const profile = unwrapMyProfile(await getMyProfile());

  return {
    profileCompleted: Boolean(profile?.profileCompleted),
  };
}

export async function setupProfile(
  payload: ProfileSetupPayload
): Promise<ApiEnvelope<ProfileSetupData>> {
  const res = await fetch(profileRoutes.setup, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<ProfileSetupData>(res);
}

export async function dismissAnnualYearReview(): Promise<ApiEnvelope<unknown>> {
  const res = await fetch(profileRoutes.dismissAnnualYearReview, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<unknown>(res);
}

export async function getProfileSetupOptions(): Promise<ProfileSetupOptions> {
  const res = await fetch(profileRoutes.setupOptions, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const envelope = await handleResponse<
    { data: Record<keyof ProfileSetupOptions, RawSetupOption[]> } |
    Record<keyof ProfileSetupOptions, RawSetupOption[]>
  >(res);
  const data = envelope.data;

  if (!data) {
    throw { code: 500, message: "Profile setup options were not returned." } as ApiError;
  }

  const rawOptions = "years" in data ? data : data.data;

  return {
    years: normalizeSetupOptions(rawOptions.years).map((year) => ({
      ...year,
      label: formatYearOfStudyLabel(year.value ?? year.label),
    })),
    majors: normalizeSetupOptions(rawOptions.majors),
    skills: normalizeSetupOptions(rawOptions.skills),
    interests: normalizeSetupOptions(rawOptions.interests),
  };
}

function normalizeSetupOptions(options: RawSetupOption[]): SetupOption[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label ?? option.name ?? String(option.id),
    value: option.value,
    userCount: option.userCount,
  }));
}

function formatYearOfStudyLabel(value: unknown): string {
  const text = String(value ?? "").trim();
  const numeric = Number(text.replace(/^year\s*/i, ""));
  const labels: Record<number, string> = {
    1: "Freshman",
    2: "Sophomore",
    3: "Junior",
    4: "Senior",
  };

  return labels[numeric] ?? text;
}
