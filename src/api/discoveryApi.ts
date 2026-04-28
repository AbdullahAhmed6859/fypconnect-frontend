import type { Profile } from "../types/dashboard";
import { API_BASE_URL } from "./routes";
import { authHeaders, handleData } from "./client";
import { normalizeProfile } from "./dashboardNormalizers";
import type { RawProfile } from "./dashboardTypes";

export async function fetchNextBrowseProfile(excludeIds: number[]): Promise<Profile | null> {
  const res = await fetch(`${API_BASE_URL}/discovery?limit=20`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleData<{ data: RawProfile[] }>(res);
  const profiles = json.data.map(normalizeProfile);

  return profiles.find((profile) => !excludeIds.includes(profile.id)) ?? null;
}
