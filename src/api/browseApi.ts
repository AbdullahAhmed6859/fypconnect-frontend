import { API_BASE_URL } from "./routes";
import { authHeaders, handleData } from "./client";

export async function likeProfile(targetUserId: number): Promise<{ isMutualMatch: boolean }> {
  const res = await fetch(`${API_BASE_URL}/browse/like`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  const json = await handleData<{ data: { isMutualMatch: boolean } }>(res);
  return { isMutualMatch: json.data.isMutualMatch };
}

export async function passProfile(targetUserId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/browse/pass`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  await handleData(res);
}

export async function likeBackMatch(targetUserId: number): Promise<{ matchId: number }> {
  const res = await fetch(`${API_BASE_URL}/browse/like`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  const json = await handleData<{ data: { match?: { matchId: number }; isMutualMatch: boolean } }>(res);
  return { matchId: json.data.match?.matchId ?? targetUserId };
}

export async function passMatch(targetUserId: number): Promise<void> {
  return passProfile(targetUserId);
}
