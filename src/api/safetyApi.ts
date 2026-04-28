import { safetyRoutes } from "./routes";
import { handleEnvelope, jsonHeaders, type ApiEnvelope } from "./client";
import type { BlockedUserData } from "./profileTypes";

export async function deleteMyAccount(): Promise<ApiEnvelope<{ deletedAt?: string }>> {
  const res = await fetch(safetyRoutes.deleteAccount, {
    method: "DELETE",
    credentials: "include",
    headers: jsonHeaders,
  });

  return handleEnvelope<{ deletedAt?: string }>(res);
}

export async function getBlockedUsers(): Promise<ApiEnvelope<BlockedUserData[]>> {
  const res = await fetch(safetyRoutes.blockedUsers, {
    method: "GET",
    credentials: "include",
    headers: jsonHeaders,
  });

  return handleEnvelope<BlockedUserData[]>(res);
}

export async function unblockUser(targetUserId: number): Promise<ApiEnvelope<{ unblockedUserId: number; removed: boolean }>> {
  const res = await fetch(safetyRoutes.unblock, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ targetUserId }),
  });

  return handleEnvelope<{ unblockedUserId: number; removed: boolean }>(res);
}

export type { BlockedUserData } from "./profileTypes";
