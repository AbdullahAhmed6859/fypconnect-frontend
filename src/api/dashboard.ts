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
  const res = await fetch(`${API_BASE_URL}/browse/next`, {
    credentials: "include",
    headers: authHeaders(),
  });

  if (res.status === 200) {
    const json = await res.json();
    if (!json.data.hasProfile) return null;
    const p = json.data.profile;

    return {
      id: p.userId,
      name: p.fullName,
      year: p.yearOfStudy,
      major: p.major,
      skills: p.skills,
      interests: p.interests,
      bio: p.bio,
      projects: p.projects,
      links: p.links,
      fypIdea: p.fypIdea,
      profilePicture: p.profilePicture,
    } as Profile;
  }

  throw { code: res.status, message: "Failed to load profile." };
}

export async function fetchMatches(): Promise<MatchedPerson[]> {
  const res = await fetch(`${API_BASE_URL}/matches`, {
    credentials: "include",
    headers: authHeaders(),
  });

  const json = await handleResponse<{ data: any[] }>(res);

  return json.data.map((m) => ({
    id: m.matchedUser.userId,
    matchId: m.matchId,
    name: m.matchedUser.fullName,
    major: m.matchedUser.major,
    year: m.matchedUser.yearOfStudy,
    skills: m.matchedUser.skills ?? [],
    interests: m.matchedUser.interests ?? [],
    bio: m.matchedUser.bio,
    fypIdea: m.matchedUser.fypIdea,
    profilePicture: m.matchedUser.profilePicture,
    lastMessagePreview: m.lastMessagePreview,
    hasUnreadMessages: m.hasUnreadMessages,
    isNewMatch: m.isNewMatch,
    hasProfileUpdated: m.hasProfileUpdated,
    matchStatus: m.isMutual ? "MUTUAL LIKE!" : "LIKED YOUR PROFILE!",
    hasExistingChat: Boolean(m.hasExistingChat),
  }));
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
  const res = await fetch(`${API_BASE_URL}/matches/${matchId}/unmatch`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
  });

  await handleResponse(res);
}

export async function blockUser(matchId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/matches/${matchId}/block`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
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
