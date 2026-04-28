import type { Profile, MatchedPerson, ChatMessage, ChatThread } from "../types/dashboard";
import { API_BASE_URL, safetyRoutes } from "./routes";

type JsonRecord = Record<string, unknown>;

type RawProfile = {
  userId?: number;
  fullName?: string | null;
  yearOfStudy?: unknown;
  year?: unknown;
  major?: string | null;
  skills?: unknown;
  interests?: unknown;
  bio?: string | null;
  biography?: string | null;
  projects?: unknown;
  links?: unknown;
  fypIdea?: string | null;
  ideas?: string | null;
  profilePicture?: string | null;
};

type RawMatch = {
  matchId?: number;
  matchedUser?: RawProfile;
  lastMessagePreview?: string | null;
  hasUnreadMessages?: boolean;
  isNewMatch?: boolean;
  hasProfileUpdated?: boolean;
};

type RawConversationMessage = {
  senderId?: number;
  content?: string;
};

type RawConversation = {
  matchedUser?: RawProfile;
  messages?: RawConversationMessage[];
};

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

  const json = await handleResponse<{ data: RawProfile[] }>(res);
  const profiles = json.data.map(normalizeProfile);

  return profiles.find((profile) => !_excludeIds.includes(profile.id)) ?? null;
}

export async function fetchMatches(): Promise<MatchedPerson[]> {
  const res = await fetch(`${API_BASE_URL}/matches/matches`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleResponse<{ data: RawMatch[] }>(res);

  return json.data.map(normalizeMatch);
}

export async function fetchUpdatedMatchProfile(person: MatchedPerson): Promise<MatchedPerson> {
  if (!person.matchId) return person;

  const res = await fetch(`${API_BASE_URL}/matches/${person.matchId}/updated-profile`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleResponse<{ data: JsonRecord }>(res);
  const updatedUser = toRawProfile(json.data.updatedUser ?? json.data.matchedUser ?? json.data);

  return {
    ...person,
    id: updatedUser.userId ?? person.id,
    name: updatedUser.fullName ?? person.name,
    major: updatedUser.major ?? person.major,
    year: formatYear(updatedUser.yearOfStudy ?? updatedUser.year ?? person.year),
    skills: toStringArray(updatedUser.skills).length ? toStringArray(updatedUser.skills) : person.skills,
    interests: toStringArray(updatedUser.interests).length ? toStringArray(updatedUser.interests) : person.interests,
    bio: updatedUser.bio ?? updatedUser.biography ?? person.bio,
    fypIdea: updatedUser.fypIdea ?? updatedUser.ideas ?? person.fypIdea,
    projects: Array.isArray(updatedUser.projects) ? updatedUser.projects : person.projects,
    links: isRecord(updatedUser.links) ? toStringRecord(updatedUser.links) : person.links,
    profilePicture: updatedUser.profilePicture ?? person.profilePicture,
    hasProfileUpdated: false,
  };
}

function normalizeMatch(m: RawMatch): MatchedPerson {
  const matchedUser = m.matchedUser ?? {};

  return {
    id: matchedUser.userId ?? 0,
    matchId: m.matchId,
    name: matchedUser.fullName ?? "Unnamed Student",
    major: matchedUser.major ?? "Undeclared",
    year: formatYear(matchedUser.yearOfStudy),
    skills: toStringArray(matchedUser.skills),
    interests: toStringArray(matchedUser.interests),
    bio: matchedUser.bio ?? undefined,
    fypIdea: matchedUser.fypIdea ?? undefined,
    profilePicture: matchedUser.profilePicture,
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

  const json = await handleResponse<{ data: RawConversation }>(res);
  const d = json.data;
  const matchedUserId = d.matchedUser?.userId ?? 0;

  return {
    personId: matchedUserId,
    messages: (d.messages ?? []).map((m) => ({
      from: m.senderId === matchedUserId ? "them" : "me",
      text: m.content ?? "",
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
  const res = await fetch(safetyRoutes.unmatch(matchId), {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
  });

  await handleResponse(res);
}

export async function blockUser(targetUserId: number): Promise<void> {
  const res = await fetch(safetyRoutes.block, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  await handleResponse(res);
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
  });
}

function normalizeProfile(p: RawProfile): Profile {
  return {
    id: p.userId ?? 0,
    name: p.fullName ?? "Unnamed Student",
    year: formatYear(p.yearOfStudy),
    major: p.major ?? "Undeclared",
    skills: toStringArray(p.skills),
    interests: toStringArray(p.interests),
    bio: p.bio ?? undefined,
    projects: Array.isArray(p.projects) ? p.projects : [],
    links: toStringRecord(p.links),
    fypIdea: p.fypIdea ?? undefined,
    profilePicture: p.profilePicture ?? null,
  };
}

function toRawProfile(value: unknown): RawProfile {
  return isRecord(value) ? (value as RawProfile) : {};
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
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
