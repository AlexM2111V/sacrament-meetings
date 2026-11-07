import { connection } from "next/server";
import type { Hymn, MeetingType, SacramentMeeting, SpeakerItem, WardBusinessItem } from "./types";

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

// ---- Runtime validation: the API response is untrusted until checked ----

type UnknownRecord = Record<string, unknown>;
const MEETING_TYPES: readonly MeetingType[] = ["testimony", "regular", "stake", "general"];

const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;
const isString = (v: unknown): v is string => typeof v === "string";

const isHymn = (v: unknown): v is Hymn =>
  isRecord(v) && typeof v.number === "number" && isString(v.title);

const isSpeakerItem = (v: unknown): v is SpeakerItem =>
  isRecord(v) &&
  isString(v.name) &&
  isString(v.topic) &&
  (v.type === "speaker" || v.type === "musical-number");

const isWardBusinessItem = (v: unknown): v is WardBusinessItem =>
  isRecord(v) && isString(v.description);

export function isSacramentMeeting(v: unknown): v is SacramentMeeting {
  return (
    isRecord(v) &&
    Number.isInteger(v.id) &&
    isString(v.date) &&
    MEETING_TYPES.includes(v.meetingType as MeetingType) &&
    isString(v.presiding) &&
    isString(v.conducting) &&
    (v.announcements === undefined ||
      (Array.isArray(v.announcements) && v.announcements.every(isString))) &&
    isHymn(v.openingHymn) &&
    isString(v.openingPrayer) &&
    Array.isArray(v.wardBusiness) &&
    v.wardBusiness.every(isWardBusinessItem) &&
    typeof v.stakeBusiness === "boolean" &&
    isHymn(v.sacramentHymn) &&
    Array.isArray(v.speakers) &&
    v.speakers.every(isSpeakerItem) &&
    isHymn(v.closingHymn) &&
    isString(v.closingPrayer)
  );
}

async function getJson(path: string): Promise<{ status: number; ok: boolean; body: unknown }> {
  // Data must be fetched per request, never during the build.
  await connection();
  const res = await fetch(new URL(path, apiBaseUrl()));
  const body: unknown = res.ok ? await res.json() : null;
  return { status: res.status, ok: res.ok, body };
}

export async function fetchMeetings(date?: string): Promise<SacramentMeeting[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const { ok, status, body } = await getJson(`/api/meetings${query}`);
  if (!ok) throw new Error(`GET /api/meetings failed with status ${status}`);
  if (!Array.isArray(body) || !body.every(isSacramentMeeting)) {
    throw new Error("GET /api/meetings returned data that is not a list of meetings");
  }
  return body;
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
