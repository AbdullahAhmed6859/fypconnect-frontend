import { API_BASE_URL } from "./routes";
import { authHeaders } from "./client";

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
  });
}
