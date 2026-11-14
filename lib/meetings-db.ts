import { neon } from '@neondatabase/serverless';
import type { MeetingType, SacramentMeeting } from './types';
import { isSacramentMeeting } from './validate';

const sql = neon(process.env.DATABASE_URL!);

export const ITEMS_PER_PAGE = 5;

export const WARD_NAME = 'La Molina Ward';

/** The ward's local time zone. "Today" and "this Sunday" are evaluated here, not in the server's zone. */
export const WARD_TIME_ZONE = 'America/Lima'; // IANA zone name; change to your ward's zone if different

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  regular: 'Sacrament Meeting',
  testimony: 'Fast & Testimony Meeting',
  stake: 'Stake Conference',
  general: 'General Conference',
};

// ---- Queries ----

// snake_case columns → the camelCase fields of SacramentMeeting. `date` comes back as text
// so it stays an exact YYYY-MM-DD string instead of a timezone-shifted Date object.
const MEETING_COLUMNS = sql.unsafe(`
  id,
  to_char(date, 'YYYY-MM-DD') AS "date",
  meeting_type                AS "meetingType",
  presiding,
  conducting,
  announcements,
  opening_hymn                AS "openingHymn",
  opening_prayer              AS "openingPrayer",
  ward_business               AS "wardBusiness",
  stake_business              AS "stakeBusiness",
  stake_business_items        AS "stakeBusinessItems",
  sacrament_hymn              AS "sacramentHymn",
  speakers,
  closing_hymn                AS "closingHymn",
  closing_prayer              AS "closingPrayer"
`);

/** Checks every row from the database before the app treats it as a SacramentMeeting. */
function toMeetings(rows: unknown[]): SacramentMeeting[] {
  return rows.map((row) => {
    if (!isSacramentMeeting(row)) {
      const id = typeof row === 'object' && row !== null && 'id' in row ? row.id : 'unknown';
      throw new Error(`Meeting row ${id} is malformed`);
    }
    return row;
  });
}

/**
 * Matches the search text against presiding, conducting, meeting type (stored value or the
 * label shown on the page), any speaker's name, or, for a full YYYY-MM-DD query, the exact
 * date (so the API's existing `getMeetings(date)` call still filters by date).
 */
function searchCondition(query: string) {
  const q = query.trim();
  // Escape LIKE wildcards so a search for "50%" means the literal text.
  const term = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
  // Users search by the label they see on the page ("Fast & Testimony Meeting",
  // "Stake Conference"), not just the stored value ("testimony", "stake").
  const needle = q.toLowerCase();
  // Only a complete date filters by date; partial text like "1" or "2026" would match everything.
  const dateMatch = isIsoDate(q) ? sql`OR date = ${q}::date` : sql``;
  const typesByLabel = Object.entries(MEETING_TYPE_LABELS)
    .filter(([, label]) => label.toLowerCase().includes(needle))
    .map(([type]) => type);
  return sql`
    presiding ILIKE ${term}
    OR conducting ILIKE ${term}
    OR meeting_type ILIKE ${term}
    OR meeting_type = ANY(${typesByLabel}::text[])
    ${dateMatch}
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(speakers) AS s
      WHERE s->>'name' ILIKE ${term}
    )
  `;
}

/**
 * Meetings (newest first) matching the search text. An empty or null query matches all.
 * With `currentPage`, returns that page of ITEMS_PER_PAGE; without it, returns every match
 * (what GET /api/meetings promises).
 */
export async function getMeetings(
  query: string | null = '',
  currentPage?: number
): Promise<SacramentMeeting[]> {
  let pageClause = sql``;
  if (currentPage !== undefined) {
    const page = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1;
    pageClause = sql`LIMIT ${ITEMS_PER_PAGE} OFFSET ${(page - 1) * ITEMS_PER_PAGE}`;
  }

  const rows = await sql`
    SELECT ${MEETING_COLUMNS}
    FROM meetings
    WHERE ${searchCondition(query ?? '')}
    ORDER BY date DESC
    ${pageClause}
  `;
  return toMeetings(rows);
}

/** Number of meetings matching the search text (across all pages). */
export async function getMeetingsCount(query: string | null = ''): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS count FROM meetings
    WHERE ${searchCondition(query ?? '')}
  `;
  return Number(rows[0].count);
}

/**
 * A `?page=` value as a whole page number between 1 and the last page. Invalid values
 * (-1, 1.5, "abc") become 1. Shared by the meetings page and the proxy so both agree.
 */
export function toPageNumber(raw: string | null | undefined, totalPages: number): number {
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, Math.max(totalPages, 1));
}

/** Number of pages getMeetings() can return for this search text. */
export async function getMeetingsTotalPages(query: string | null = ''): Promise<number> {
  return Math.ceil((await getMeetingsCount(query)) / ITEMS_PER_PAGE);
}

export async function getMeetingById(id: number): Promise<SacramentMeeting | null> {
  const rows = await sql`SELECT ${MEETING_COLUMNS} FROM meetings WHERE id = ${id}`;
  return toMeetings(rows)[0] ?? null;
}

export async function getMeetingByDate(date: string): Promise<SacramentMeeting | null> {
  const rows = await sql`SELECT ${MEETING_COLUMNS} FROM meetings WHERE date = ${date}`;
  return toMeetings(rows)[0] ?? null;
}

export async function getMeetingsByType(type: MeetingType): Promise<SacramentMeeting[]> {
  const rows = await sql`
    SELECT ${MEETING_COLUMNS} FROM meetings WHERE meeting_type = ${type} ORDER BY date DESC
  `;
  return toMeetings(rows);
}

export async function getMeetingIds(): Promise<number[]> {
  const rows = await sql`SELECT id FROM meetings ORDER BY id`;
  return rows.map((row) => Number(row.id));
}

/** The meeting held on the most recent Sunday (today, if today is Sunday) in the ward's time zone. */
export async function getCurrentMeeting(now: Date = new Date()): Promise<SacramentMeeting | null> {
  return getMeetingByDate(getMostRecentSunday(todayIsoDate(now)));
}

// Mutation stubs — will be wired to the database in Week 04
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function addMeeting(
  data: Omit<SacramentMeeting, 'id'>
): Promise<SacramentMeeting> {
  throw new Error('addMeeting: database implementation coming in Week 04');
}

export async function updateMeeting(
  id: number,
  updates: Partial<SacramentMeeting>
): Promise<SacramentMeeting | null> {
  throw new Error('updateMeeting: database implementation coming in Week 04');
}

export async function deleteMeeting(id: number): Promise<boolean> {
  throw new Error('deleteMeeting: database implementation coming in Week 04');
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ---- Helpers ----

/** True for a real calendar date in YYYY-MM-DD form (rejects e.g. 2026-02-30). */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Parses a route segment as a whole number. Returns null only when the segment is not a
 * valid whole number (e.g. "alex", "1.5") → 400. Numbers like "0", "-1" or "05" parse
 * fine and simply match no meeting → 404.
 */
export function parseMeetingId(raw: string): number | null {
  return /^-?\d+$/.test(raw) ? Number(raw) : null;
}

/** Today's date (YYYY-MM-DD) in the ward's time zone, regardless of the server's time zone. */
export function todayIsoDate(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: WARD_TIME_ZONE }).format(now);
}

/** The most recent Sunday (YYYY-MM-DD) on or before `isoDate`. Sunday = 0 … Saturday = 6. */
export function getMostRecentSunday(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  // Pure calendar arithmetic in UTC so no time zone can shift the day.
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

/** Formats an ISO calendar date without timezone drift. */
export function formatMeetingDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
