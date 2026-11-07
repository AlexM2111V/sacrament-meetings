import type { MeetingType, SacramentMeeting } from './types';

export const WARD_NAME = 'La Molina Ward';

/** The ward's local time zone. "Today" and "this Sunday" are evaluated here, not in the server's zone. */
export const WARD_TIME_ZONE = 'America/Lima'; // IANA zone name; change to your ward's zone if different

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  regular: 'Sacrament Meeting',
  testimony: 'Fast & Testimony Meeting',
  stake: 'Stake Conference',
  general: 'General Conference',
};

const meetings: SacramentMeeting[] = [
  {
    id: 1,
    date: '2026-10-04',
    meetingType: 'general',
    presiding: 'Bishop Daniel Reyes',
    conducting: 'Brother Samuel Ortiz',
    announcements: ['General Conference sessions broadcast at the meetinghouse'],
    openingHymn: { number: 2, title: 'The Spirit of God' },
    openingPrayer: 'Sister Laura Bennett',
    wardBusiness: [],
    stakeBusiness: false,
    sacramentHymn: { number: 169, title: 'As Now We Take the Sacrament' },
    speakers: [],
    closingHymn: { number: 19, title: 'We Thank Thee, O God, for a Prophet' },
    closingPrayer: 'Brother Tyler Nguyen',
  },
  {
    id: 2,
    date: '2026-10-18',
    meetingType: 'regular',
    presiding: 'Bishop Daniel Reyes',
    conducting: 'Brother Andrew Price',
    announcements: ['Ward temple night Thursday, Oct 22'],
    openingHymn: { number: 85, title: 'How Firm a Foundation' },
    openingPrayer: 'Sister Olivia Turner',
    wardBusiness: [
      { description: 'Release: Sister Amy Park as Primary pianist' },
      { description: 'Sustain: Sister Julia Moore as Primary pianist' },
    ],
    stakeBusiness: false,
    sacramentHymn: { number: 193, title: 'I Stand All Amazed' },
    speakers: [
      { name: 'Ethan Morales', topic: 'Prayer', type: 'speaker' },
      { name: 'Sister Rachel Kim', topic: 'Ministering', type: 'speaker' },
      { name: 'Ward Choir', topic: 'Consider the Lilies', type: 'musical-number' },
      { name: 'Brother James Walker', topic: 'Faith in Jesus Christ', type: 'speaker' },
    ],
    closingHymn: { number: 98, title: 'I Need Thee Every Hour' },
    closingPrayer: 'Brother Carlos Diaz',
  },
  {
    id: 3,
    date: '2026-10-25',
    meetingType: 'regular',
    presiding: 'Bishop Daniel Reyes',
    conducting: 'Brother Samuel Ortiz',
    announcements: ['Trunk-or-treat Friday, Oct 30 at 6:00 PM'],
    openingHymn: { number: 6, title: 'Redeemer of Israel' },
    openingPrayer: 'Sister Maria Lopez',
    wardBusiness: [],
    stakeBusiness: true,
    sacramentHymn: { number: 172, title: 'In Humility, Our Savior' },
    speakers: [
      { name: 'Sister Emily Ward', topic: 'The Book of Mormon', type: 'speaker' },
      { name: 'Brother Lucas Hall', topic: 'Personal Revelation', type: 'speaker' },
    ],
    closingHymn: { number: 86, title: 'How Great Thou Art' },
    closingPrayer: 'Sister Ava Mitchell',
  },
  {
    id: 4,
    date: '2026-11-01',
    meetingType: 'testimony',
    presiding: 'Bishop Daniel Reyes',
    conducting: 'Bishop Daniel Reyes',
    announcements: ['Tithing declaration appointments begin Nov 15'],
    openingHymn: { number: 136, title: 'I Know That My Redeemer Lives' },
    openingPrayer: 'Brother Noah Bishop',
    wardBusiness: [{ description: 'Confirmation: Sophia Grant' }],
    stakeBusiness: false,
    sacramentHymn: { number: 181, title: 'Jesus of Nazareth, Savior and King' },
    speakers: [],
    closingHymn: { number: 152, title: 'God Be with You Till We Meet Again' },
    closingPrayer: 'Sister Hannah Lee',
  },
  {
    id: 5,
    date: '2026-11-08',
    meetingType: 'regular',
    presiding: 'Bishop Daniel Reyes',
    conducting: 'Brother Andrew Price',
    announcements: [
      'Ward Thanksgiving dinner Saturday, Nov 21 at 5:30 PM',
      'Temple night Thursday, Nov 12',
    ],
    openingHymn: { number: 27, title: 'Praise to the Man' },
    openingPrayer: 'Sister Grace Robinson',
    wardBusiness: [
      { description: 'Sustain: Brother Kevin Adams as Elders Quorum secretary' },
    ],
    stakeBusiness: false,
    sacramentHymn: { number: 170, title: 'God, Our Father, Hear Us Pray' },
    speakers: [
      { name: 'Lily Carter', topic: 'Gratitude', type: 'speaker' },
      { name: 'Sister Grace Robinson', topic: 'Counting Our Blessings', type: 'speaker' },
      { name: 'Primary Children', topic: 'Come, Ye Thankful People', type: 'musical-number' },
      { name: 'Brother David Hughes', topic: 'Thanksgiving and the Atonement', type: 'speaker' },
    ],
    closingHymn: { number: 94, title: 'Come, Ye Thankful People' },
    closingPrayer: 'Brother Isaac Foster',
  },
  {
    id: 6,
    date: '2026-11-15',
    meetingType: 'stake',
    presiding: 'President Mark Sorensen',
    conducting: 'President Mark Sorensen',
    openingHymn: { number: 3, title: 'Now Let Us Rejoice' },
    openingPrayer: 'Sister Claire Sorensen',
    wardBusiness: [],
    stakeBusiness: true,
    sacramentHymn: { number: 176, title: "'Tis Sweet to Sing the Matchless Love" },
    speakers: [
      { name: 'Elder Thomas Young', topic: 'Covenant Belonging', type: 'speaker' },
      { name: 'Sister Felicia Newman', topic: 'The Convenant Path', type: 'speaker' },
      { name: 'Stake Choir', topic: 'Come, Thou Fount of Every Blessing', type: 'musical-number' },
      { name: 'President Josh Thompson', topic: 'The Oath and Covenant of the Priesthood', type: 'speaker' },
      { name: 'President Mark Sorensen', topic: 'Gathering Israel', type: 'speaker' },
    ],
    closingHymn: { number: 166, title: 'Abide with Me!' },
    closingPrayer: 'Brother Henry Clark',
  },
];

// ---- Queries ----

/** All meetings, newest first. Pass an ISO date (YYYY-MM-DD) to return only meetings on that date. */
export async function getMeetings(date?: string | null): Promise<SacramentMeeting[]> {
  return meetings
    .filter((m) => !date || m.date === date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getMeetingById(id: number): Promise<SacramentMeeting | undefined> {
  return meetings.find((m) => m.id === id);
}

export async function getMeetingByDate(date: string): Promise<SacramentMeeting | undefined> {
  return meetings.find((m) => m.date === date);
}

export async function getMeetingsByType(type: MeetingType): Promise<SacramentMeeting[]> {
  return (await getMeetings()).filter((m) => m.meetingType === type);
}

export async function getMeetingIds(): Promise<number[]> {
  return meetings.map((m) => m.id);
}

/** The meeting held on the most recent Sunday (today, if today is Sunday) in the ward's time zone. */
export async function getCurrentMeeting(now: Date = new Date()): Promise<SacramentMeeting | undefined> {
  return getMeetingByDate(getMostRecentSunday(todayIsoDate(now)));
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
