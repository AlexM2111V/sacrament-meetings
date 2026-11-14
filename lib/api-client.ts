import { connection } from "next/server";
import type { SacramentMeeting } from "./types";
import { isSacramentMeeting } from "./validate";

// Typed helpers for Server Components that read data through this app's own API routes.

/**
 * Base URL of this app's API. It comes from server configuration, never from request
 * headers, so a forged Host header cannot redirect server-side fetches elsewhere.
 */
function apiBaseUrl(): URL {
  const configured = process.env.APP_URL;
  if (configured) return new URL(configured); // throws on a malformed value
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}

async function getJson(path: string): Promise<{ status: number; ok: boolean; body: unknown }> {
  // Data must be fetched per request, never during the build.
  await connection();
  const res = await fetch(new URL(path, apiBaseUrl()));
  const body: unknown = res.ok ? await res.json() : null;
  return { status: res.status, ok: res.ok, body };
}

/** Returns null when the API answers 400 (bad id) or 404 (no such meeting). */
export async function fetchMeeting(id: string): Promise<SacramentMeeting | null> {
  const { ok, status, body } = await getJson(`/api/meetings/${encodeURIComponent(id)}`);
  if (status === 400 || status === 404) return null;
  if (!ok) throw new Error(`GET /api/meetings/${id} failed with status ${status}`);
  if (!isSacramentMeeting(body)) {
    throw new Error(`GET /api/meetings/${id} returned data that is not a meeting`);
  }
  return body;
}
