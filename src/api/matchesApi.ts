import type { MatchedPerson } from "../types/dashboard";
import { API_BASE_URL } from "./routes";
import { authHeaders, handleData } from "./client";
import {
  normalizeMatch,
  normalizeUpdatedMatch,
  unwrapUpdatedUser,
} from "./dashboardNormalizers";
import type { JsonRecord, RawMatch } from "./dashboardTypes";

export async function fetchMatches(): Promise<MatchedPerson[]> {
  const res = await fetch(`${API_BASE_URL}/matches/matches`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleData<{ data: RawMatch[] }>(res);

  return json.data.map(normalizeMatch);
}

export async function fetchUpdatedMatchProfile(person: MatchedPerson): Promise<MatchedPerson> {
  if (!person.matchId) return person;

  const res = await fetch(`${API_BASE_URL}/matches/${person.matchId}/updated-profile`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleData<{ data: JsonRecord }>(res);
  return normalizeUpdatedMatch(person, unwrapUpdatedUser(json.data));
}
