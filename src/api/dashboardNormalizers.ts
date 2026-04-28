import type { ChatThread, MatchedPerson, Profile } from "../types/dashboard";
import type { JsonRecord, RawConversation, RawMatch, RawProfile } from "./dashboardTypes";

export function normalizeProfile(p: RawProfile): Profile {
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

export function normalizeMatch(m: RawMatch): MatchedPerson {
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

export function normalizeUpdatedMatch(person: MatchedPerson, value: unknown): MatchedPerson {
  const updatedUser = toRawProfile(value);

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

export function normalizeConversation(d: RawConversation): ChatThread {
  const matchedUserId = d.matchedUser?.userId ?? 0;

  return {
    personId: matchedUserId,
    messages: (d.messages ?? []).map((m) => ({
      from: m.senderId === matchedUserId ? "them" : "me",
      text: m.content ?? "",
    })),
    chatStatus: "SEEN",
  };
}

export function unwrapUpdatedUser(data: JsonRecord) {
  return data.updatedUser ?? data.matchedUser ?? data;
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
