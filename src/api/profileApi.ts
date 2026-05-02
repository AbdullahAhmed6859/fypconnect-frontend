// Profile endpoints for setup, editing, preferences, and completion checks.
import { profileRoutes } from "./routes";
import { handleEnvelope, jsonHeaders, type ApiEnvelope } from "./client";
import {
  normalizeSetupEnvelope,
  unwrapMyProfile,
} from "./profileNormalizers";
import type {
  MyProfileData,
  ProfileSetupData,
  ProfileSetupOptions,
  ProfileSetupPayload,
  RawSetupOption,
  UpdateProfilePayload,
} from "./profileTypes";

export async function getMyProfile(): Promise<ApiEnvelope<{ data: MyProfileData }>> {
  const res = await fetch(profileRoutes.me, {
    method: "GET",
    credentials: "include",
    headers: jsonHeaders,
  });

  return handleEnvelope<{ data: MyProfileData }>(res);
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
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return handleEnvelope<ProfileSetupData>(res);
}

export async function updateMyProfile(
  payload: UpdateProfilePayload
): Promise<ApiEnvelope<{ updatedAt?: string; profileUpdatedNotificationsSent?: boolean }>> {
  const res = await fetch(profileRoutes.update, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return handleEnvelope<{ updatedAt?: string; profileUpdatedNotificationsSent?: boolean }>(res);
}

export async function dismissAnnualYearReview(): Promise<ApiEnvelope<unknown>> {
  const res = await fetch(profileRoutes.dismissAnnualYearReview, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
  });

  return handleEnvelope<unknown>(res);
}

export async function getProfileSetupOptions(): Promise<ProfileSetupOptions> {
  const res = await fetch(profileRoutes.setupOptions, {
    method: "GET",
    credentials: "include",
    headers: jsonHeaders,
  });

  const envelope = await handleEnvelope<
    { data: Record<keyof ProfileSetupOptions, RawSetupOption[]> } |
    Record<keyof ProfileSetupOptions, RawSetupOption[]>
  >(res);

  return normalizeSetupEnvelope(envelope);
}

export { unwrapMyProfile };
export type {
  MyProfileData,
  ProfileSetupData,
  ProfileSetupOptions,
  ProfileSetupPayload,
  SetupOption,
  UpdateProfilePayload,
} from "./profileTypes";
