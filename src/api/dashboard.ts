// Dashboard API layer
// All functions currently use dummy data. Replace with real fetch calls once backend is ready.
// Base URL when integrating: http://localhost:5000/api/v1

import type { Profile, MatchedPerson, ChatMessage, ChatThread } from "../types/dashboard";
import {
  DUMMY_MATCHES,
  DUMMY_BROWSE_POOL,
  DUMMY_CHAT_THREADS,
} from "../data/dashboardData";

const fakeDelay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// GET /browse/next
// Returns the next profile from the browse pool, excluding already seen/passed/liked IDs
export async function fetchNextBrowseProfile(
  excludeIds: number[]
): Promise<Profile | null> {
  await fakeDelay();
  const next = DUMMY_BROWSE_POOL.find((p) => !excludeIds.includes(p.id));
  return next ?? null;
}

// GET /matches
// Returns all people who have liked the current user
export async function fetchMatches(): Promise<MatchedPerson[]> {
  await fakeDelay();
  return DUMMY_MATCHES;
}

// POST /browse/like
// Current user likes a browse profile. Returns whether it was a mutual match.
export async function likeProfile(targetUserId: number): Promise<{ isMutualMatch: boolean }> {
  await fakeDelay(300);
  // Dummy: no browse pool profiles are mutual matches by default
  return { isMutualMatch: false };
}

// POST /browse/pass
// Current user passes a browse profile — permanent, won't show again
export async function passProfile(targetUserId: number): Promise<void> {
  await fakeDelay(200);
}

// POST /browse/like (used when liking back from the Matches tab)
// Returns matchId so the chat can be opened
export async function likeBackMatch(targetUserId: number): Promise<{ matchId: number }> {
  await fakeDelay(300);
  return { matchId: targetUserId * 10 }; // dummy matchId
}

// POST /browse/pass (used when passing from the Matches tab)
export async function passMatch(targetUserId: number): Promise<void> {
  await fakeDelay(200);
}

// GET /chat/conversations/{matchId}
// Returns the full message history for a match
export async function fetchChatHistory(matchId: number): Promise<ChatThread | null> {
  await fakeDelay();
  return DUMMY_CHAT_THREADS.find((t) => t.personId === matchId) ?? null;
}

// POST /chat/conversations/{matchId}/messages
// Sends a message. Returns the saved message.
export async function sendChatMessage(
  matchId: number,
  content: string
): Promise<ChatMessage> {
  await fakeDelay(200);
  return { from: "me", text: content };
}

// POST /matches/{matchId}/unmatch
export async function unmatchUser(matchId: number): Promise<void> {
  await fakeDelay(300);
}

// POST /matches/{matchId}/block
export async function blockUser(matchId: number): Promise<void> {
  await fakeDelay(300);
}

// POST /auth/logout
export async function logoutUser(): Promise<void> {
  await fakeDelay(200);
}
