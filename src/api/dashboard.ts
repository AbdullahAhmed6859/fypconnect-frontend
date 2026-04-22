import type { Profile, MatchedPerson, ChatMessage, ChatThread } from "../types/dashboard";
import { API_BASE_URL } from "./routes";

function authHeaders() {
  return { "Content-Type": "application/json" };
}

async function parseJsonSafely(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await parseJsonSafely(res);
  if (!res.ok) {
    throw {
      code: res.status,
      message: json?.message ?? json?.error ?? "Something went wrong.",
    };
  }
  return json as T;
}

export async function fetchNextBrowseProfile(_excludeIds: number[]): Promise<Profile | null> {
  const res = await fetch(`${API_BASE_URL}/discovery?limit=20`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleResponse<{ data: any[] }>(res);
  const profiles = json.data.map(normalizeProfile);

  return profiles.find((profile) => !_excludeIds.includes(profile.id)) ?? null;
}

export async function fetchMatches(): Promise<MatchedPerson[]> {
  const res = await fetch(`${API_BASE_URL}/matches/matches`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleResponse<{ data: any[] }>(res);

  return json.data.map(normalizeMatch);
}

export async function fetchUpdatedMatchProfile(person: MatchedPerson): Promise<MatchedPerson> {
  if (!person.matchId) return person;

  const res = await fetch(`${API_BASE_URL}/matches/${person.matchId}/updated-profile`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleResponse<{ data: any }>(res);
  const updatedUser = json.data?.updatedUser ?? json.data?.matchedUser ?? json.data;

  return {
    ...person,
    id: updatedUser.userId ?? person.id,
    name: updatedUser.fullName ?? person.name,
    major: updatedUser.major ?? person.major,
    year: formatYear(updatedUser.yearOfStudy ?? updatedUser.year ?? person.year),
    skills: updatedUser.skills ?? person.skills,
    interests: updatedUser.interests ?? person.interests,
    bio: updatedUser.bio ?? updatedUser.biography ?? person.bio,
    fypIdea: updatedUser.fypIdea ?? updatedUser.ideas ?? person.fypIdea,
    projects: updatedUser.projects ?? person.projects,
    links: updatedUser.links ?? person.links,
    profilePicture: updatedUser.profilePicture ?? person.profilePicture,
    hasProfileUpdated: false,
  };
}

function normalizeMatch(m: any): MatchedPerson {
  return {
    id: m.matchedUser.userId,
    matchId: m.matchId,
    name: m.matchedUser.fullName ?? "Unnamed Student",
    major: m.matchedUser.major ?? "Undeclared",
    year: formatYear(m.matchedUser.yearOfStudy),
    skills: m.matchedUser.skills ?? [],
    interests: m.matchedUser.interests ?? [],
    bio: m.matchedUser.bio,
    fypIdea: m.matchedUser.fypIdea,
    profilePicture: m.matchedUser.profilePicture,
    lastMessagePreview: m.lastMessagePreview,
    hasUnreadMessages: m.hasUnreadMessages,
    isNewMatch: m.isNewMatch,
    hasProfileUpdated: m.hasProfileUpdated,
    matchStatus: "MUTUAL LIKE!",
    hasExistingChat: true,
  };
}

export async function likeProfile(targetUserId: number): Promise<{ isMutualMatch: boolean }> {
  const res = await fetch(`${API_BASE_URL}/browse/like`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  const json = await handleResponse<{ data: { isMutualMatch: boolean } }>(res);
  return { isMutualMatch: json.data.isMutualMatch };
}

export async function passProfile(targetUserId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/browse/pass`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  await handleResponse(res);
}

export async function likeBackMatch(targetUserId: number): Promise<{ matchId: number }> {
  const res = await fetch(`${API_BASE_URL}/browse/like`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  const json = await handleResponse<{ data: { match?: { matchId: number }; isMutualMatch: boolean } }>(res);
  return { matchId: json.data.match?.matchId ?? targetUserId };
}

export async function passMatch(targetUserId: number): Promise<void> {
  return passProfile(targetUserId);
}

export async function fetchChatHistory(matchId: number): Promise<ChatThread | null> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${matchId}`, {
    credentials: "include",
    headers: authHeaders(),
  });

  if (res.status === 403 || res.status === 404) return null;

  const json = await handleResponse<{ data: any }>(res);
  const d = json.data;

  return {
    personId: d.matchedUser.userId,
    messages: d.messages.map((m: any) => ({
      from: m.senderId === d.matchedUser.userId ? "them" : "me",
      text: m.content,
    })),
    chatStatus: "SEEN",
  } as ChatThread;
}

export async function sendChatMessage(matchId: number, content: string): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${matchId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });

  await handleResponse(res);
  return { from: "me", text: content };
}

export async function unmatchUser(matchId: number): Promise<void> {
  void matchId;
  throw { code: 501, message: "Unmatch is not available in the backend yet." };
}

export async function blockUser(matchId: number): Promise<void> {
  void matchId;
  throw { code: 501, message: "Block is not available in the backend yet." };
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
  });
}

function normalizeProfile(p: any): Profile {
  return {
    id: p.userId,
    name: p.fullName ?? "Unnamed Student",
    year: formatYear(p.yearOfStudy),
    major: p.major ?? "Undeclared",
    skills: p.skills ?? [],
    interests: p.interests ?? [],
    bio: p.bio ?? undefined,
    projects: p.projects ?? [],
    links: p.links ?? {},
    fypIdea: p.fypIdea ?? undefined,
    profilePicture: p.profilePicture ?? null,
  };
}

function formatYear(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Year N/A";
  const text = String(value).trim();
  const numeric = Number(text.replace(/^year\s*/i, ""));
  const labels: Record<number, string> = {
    1: "Freshman",
    2: "Sophomore",
    3: "Junior",
    4: "Senior",
  };

  return labels[numeric] ?? text;
}
