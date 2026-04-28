import type { ChatMessage, ChatThread } from "../types/dashboard";
import { API_BASE_URL } from "./routes";
import { authHeaders, handleData } from "./client";
import { normalizeConversation } from "./dashboardNormalizers";
import type { RawConversation } from "./dashboardTypes";

export async function fetchChatHistory(matchId: number): Promise<ChatThread | null> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${matchId}`, {
    credentials: "include",
    headers: authHeaders(),
  });

  if (res.status === 403 || res.status === 404) return null;

  const json = await handleData<{ data: RawConversation }>(res);
  return normalizeConversation(json.data);
}

export async function sendChatMessage(matchId: number, content: string): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${matchId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });

  await handleData(res);
  return { from: "me", text: content };
}
