import { API_BASE_URL } from "./config";
import { supabase } from "./supabase";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls the BuildBrief web API (where the Claude calls happen) with the
 * signed-in user's access token. The server verifies the token and applies
 * the same ownership rules and rate limits as the website.
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError("Please sign in again.", 401);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
      if (!res.ok) {
        const error = new ApiError(json.error || `Something went wrong (${res.status}).`, res.status);
        // Rate-limit (429) messages are meant for the user; don't retry those.
        if (attempt === 0 && RETRYABLE.has(res.status) && res.status !== 429) {
          lastError = error;
          await sleep(900);
          continue;
        }
        throw error;
      }
      return json;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      lastError = error;
      if (attempt === 0) {
        await sleep(900);
        continue;
      }
    }
  }
  throw lastError instanceof ApiError
    ? lastError
    : new ApiError("Couldn't reach BuildBrief. Check your connection and try again.", 0);
}
