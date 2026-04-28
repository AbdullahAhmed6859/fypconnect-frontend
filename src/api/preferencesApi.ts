import { profileRoutes } from "./routes";
import { handleEnvelope, jsonHeaders, type ApiEnvelope } from "./client";
import { unwrapPreferences } from "./profileNormalizers";
import type { PreferencesData } from "./profileTypes";

export async function getMyPreferences(): Promise<ApiEnvelope<{ data: PreferencesData } | PreferencesData | null>> {
  const res = await fetch(profileRoutes.preferences, {
    method: "GET",
    credentials: "include",
    headers: jsonHeaders,
  });

  return handleEnvelope<{ data: PreferencesData } | PreferencesData | null>(res);
}

export async function updateMyPreferences(
  payload: PreferencesData
): Promise<ApiEnvelope<{ preferredMajorIds: number[]; preferredSkillIds: number[]; preferredInterestIds: number[] }>> {
  const res = await fetch(profileRoutes.preferences, {
    method: "PUT",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return handleEnvelope<{ preferredMajorIds: number[]; preferredSkillIds: number[]; preferredInterestIds: number[] }>(res);
}

export { unwrapPreferences };
export type { PreferencesData } from "./profileTypes";
