import { neon } from '@neondatabase/serverless';
import type { MeetingType, SacramentMeeting } from './types';
import { isSacramentMeeting } from './validate';
import { MEETING_TYPE_LABELS } from './meeting-form';

// Re-exported so existing imports from this module keep working.
export { MEETING_TYPE_LABELS };

const sql = neon(process.env.DATABASE_URL!);

export const ITEMS_PER_PAGE = 5;

export const WARD_NAME = 'La Molina Ward';

/** The ward's local time zone. "Today" and "this Sunday" are evaluated here, not in the server's zone. */
export const WARD_TIME_ZONE = 'America/Lima'; // IANA zone name; change to your ward's zone if different

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

/** The list page's two tabs: meetings from today on, and meetings before today. */
export type MeetingTimeframe = 'upcoming' | 'past';

/** A `?when=` value as a tab. Anything other than "past" (including nothing) means upcoming. */
export function toTimeframe(raw: string | null | undefined): MeetingTimeframe {
  return raw === 'past' ? 'past' : 'upcoming';
}

/**
 * Today's meeting counts as upcoming until the day ends. "Today" is the ward's date, not the
 * database's (Neon runs in UTC, which is already Monday on a Sunday evening in the Americas).
 */
function timeframeCondition(when: MeetingTimeframe | undefined) {
  if (when === undefined) return sql``;
  const today = todayIsoDate(new Date());
  return when === 'upcoming' ? sql`AND date >= ${today}::date` : sql`AND date < ${today}::date`;
}

/**
 * Meetings matching the search text. An empty or null query matches all.
 * With `when`, only that tab's meetings, ordered so the one nearest today comes first:
 * upcoming soonest first, past most recent first. Without it, every meeting, newest first.
 * With `currentPage`, returns that page of ITEMS_PER_PAGE; without it, returns every match
 * (what GET /api/meetings promises).
 */
export async function getMeetings(
  query: string | null = '',
  currentPage?: number,
  when?: MeetingTimeframe
): Promise<SacramentMeeting[]> {
  let pageClause = sql``;
  if (currentPage !== undefined) {
    const page = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1;
    pageClause = sql`LIMIT ${ITEMS_PER_PAGE} OFFSET ${(page - 1) * ITEMS_PER_PAGE}`;
  }
  const order = when === 'upcoming' ? sql`ORDER BY date ASC` : sql`ORDER BY date DESC`;

  const rows = await sql`
    SELECT ${MEETING_COLUMNS}
    FROM meetings
    WHERE (${searchCondition(query ?? '')}) ${timeframeCondition(when)}
    ${order}
    ${pageClause}
  `;
  return toMeetings(rows);
}

/** Number of meetings matching the search text (across all pages), optionally in one tab. */
export async function getMeetingsCount(
  query: string | null = '',
  when?: MeetingTimeframe
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS count FROM meetings
    WHERE (${searchCondition(query ?? '')}) ${timeframeCondition(when)}
  `;
  return Number(rows[0].count);
}

/** Matches in each tab, in one query, for the tab labels. */
export async function getMeetingsCountByTimeframe(
  query: string | null = ''
): Promise<Record<MeetingTimeframe, number>> {
  const today = todayIsoDate(new Date());
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE date >= ${today}::date) AS upcoming,
      COUNT(*) FILTER (WHERE date < ${today}::date)  AS past
    FROM meetings
    WHERE ${searchCondition(query ?? '')}
  `;
  return { upcoming: Number(rows[0].upcoming), past: Number(rows[0].past) };
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

/** Number of pages getMeetings() can return for this search text and tab. */
export async function getMeetingsTotalPages(
  query: string | null = '',
  when?: MeetingTimeframe
): Promise<number> {
  return Math.ceil((await getMeetingsCount(query, when)) / ITEMS_PER_PAGE);
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

// ---- Mutations ----
// Every value is sent as a query parameter (never spliced into the SQL text), so user input
// can't change the statement. Callers (lib/actions.ts) validate the data before it gets here.

export type MeetingInput = Omit<SacramentMeeting, 'id'>;

/** A jsonb parameter, or null when the field is absent (so COALESCE keeps the stored value). */
const json = (value: unknown) => (value === undefined ? null : JSON.stringify(value));

/** Postgres error code for a UNIQUE violation, and the unique constraint on meetings.date. */
const UNIQUE_VIOLATION = '23505';
const DATE_CONSTRAINT = 'meetings_date_key';

/**
 * True when the database rejected a write because another meeting already uses that date.
 * Checks the constraint too: a clash on another key (e.g. the id sequence falling behind
 * meetings_pkey) is a real error, not something the user can fix by picking another date.
 */
export function isDuplicateDateError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION &&
    'constraint' in error &&
    error.constraint === DATE_CONSTRAINT
  );
}

export async function addMeeting(data: MeetingInput): Promise<SacramentMeeting> {
  const rows = await sql`
    INSERT INTO meetings (
      date, meeting_type, presiding, conducting, announcements,
      opening_hymn, opening_prayer, ward_business, stake_business, stake_business_items,
      sacrament_hymn, speakers, closing_hymn, closing_prayer
    ) VALUES (
      ${data.date}::date,
      ${data.meetingType},
      ${data.presiding},
      ${data.conducting},
      ${data.announcements ?? []}::text[],
      ${json(data.openingHymn)}::jsonb,
      ${data.openingPrayer},
      ${json(data.wardBusiness)}::jsonb,
      ${data.stakeBusiness},
      ${json(data.stakeBusinessItems ?? [])}::jsonb,
      ${json(data.sacramentHymn)}::jsonb,
      ${json(data.speakers)}::jsonb,
      ${json(data.closingHymn)}::jsonb,
      ${data.closingPrayer}
    )
    RETURNING ${MEETING_COLUMNS}
  `;
  return toMeetings(rows)[0];
}

/**
 * Updates only the fields present in `updates`; omitted fields keep their stored value.
 * Returns the updated meeting, or null when no meeting has that id.
 */
export async function updateMeeting(
  id: number,
  updates: Partial<MeetingInput>
): Promise<SacramentMeeting | null> {
  const rows = await sql`
    UPDATE meetings SET
      date                 = COALESCE(${updates.date ?? null}::date, date),
      meeting_type         = COALESCE(${updates.meetingType ?? null}::text, meeting_type),
      presiding            = COALESCE(${updates.presiding ?? null}::text, presiding),
      conducting           = COALESCE(${updates.conducting ?? null}::text, conducting),
      announcements        = COALESCE(${updates.announcements ?? null}::text[], announcements),
      opening_hymn         = COALESCE(${json(updates.openingHymn)}::jsonb, opening_hymn),
      opening_prayer       = COALESCE(${updates.openingPrayer ?? null}::text, opening_prayer),
      ward_business        = COALESCE(${json(updates.wardBusiness)}::jsonb, ward_business),
      stake_business       = COALESCE(${updates.stakeBusiness ?? null}::boolean, stake_business),
      stake_business_items = COALESCE(${json(updates.stakeBusinessItems)}::jsonb, stake_business_items),
      sacrament_hymn       = COALESCE(${json(updates.sacramentHymn)}::jsonb, sacrament_hymn),
      speakers             = COALESCE(${json(updates.speakers)}::jsonb, speakers),
      closing_hymn         = COALESCE(${json(updates.closingHymn)}::jsonb, closing_hymn),
      closing_prayer       = COALESCE(${updates.closingPrayer ?? null}::text, closing_prayer)
    WHERE id = ${id}
    RETURNING ${MEETING_COLUMNS}
  `;
  return toMeetings(rows)[0] ?? null;
}

/** Returns false when no meeting had that id (e.g. it was already deleted). */
export async function deleteMeeting(id: number): Promise<boolean> {
  const rows = await sql`DELETE FROM meetings WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

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
