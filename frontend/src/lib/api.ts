/**
 * Returns the base backend API URL.
 * Priority: NEXT_PUBLIC_API_URL env var only.
 * This is safe to call at module level and inside hooks/effects.
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || '';
}

/** Shorthand constant for the API URL (resolved once at import time in browser). */
export const API_URL = getApiUrl();
