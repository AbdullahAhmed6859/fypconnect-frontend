import { safetyRoutes } from "./routes";
import { authHeaders, handleData } from "./client";

export async function unmatchUser(matchId: number): Promise<void> {
  const res = await fetch(safetyRoutes.unmatch(matchId), {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
  });

  await handleData(res);
}

export async function blockUser(targetUserId: number): Promise<void> {
  const res = await fetch(safetyRoutes.block, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  await handleData(res);
}
