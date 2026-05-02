// Shared fetch response handling for API calls that use the backend envelope format.
export type ApiError = {
  code: number;
  message: string;
};

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export const jsonHeaders = { "Content-Type": "application/json" };

export function authHeaders() {
  return jsonHeaders;
}

async function parseJsonSafely(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function handleEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const json = await parseJsonSafely(res);

  if (!res.ok) {
    throw {
      code: res.status,
      message: json?.message ?? json?.error ?? "Something went wrong. Please try again.",
    } as ApiError;
  }

  return json as ApiEnvelope<T>;
}

export async function handleData<T>(res: Response): Promise<T> {
  const json = await parseJsonSafely(res);

  if (!res.ok) {
    throw {
      code: res.status,
      message: json?.message ?? json?.error ?? "Something went wrong.",
    } as ApiError;
  }

  return json as T;
}
