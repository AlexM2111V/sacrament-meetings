import type { MeetingType, SacramentMeeting } from './types';

// Shared by the meeting form (Client Components) and lib/actions.ts (server). It must not
// import lib/meetings-db.ts, which holds the database connection.

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  regular: 'Sacrament Meeting',
  testimony: 'Fast & Testimony Meeting',
  stake: 'Stake Conference',
  general: 'General Conference',
};

/** Id of the result count on /meetings; focus goes there after a delete removes a card. */
export const MEETINGS_STATUS_ID = 'meetings-status';

export interface SpeakerFormValues {
  name: string;
  topic: string;
  type: string;
}

/**
 * The meeting form's fields exactly as typed. Lists (announcements, business items) are
 * one item per line. On a failed submission the server sends these back so nothing is lost.
 */
export interface MeetingFormValues {
  date: string;
  meetingType: string;
  presiding: string;
  conducting: string;
  announcements: string;
  openingHymnNumber: string;
  openingHymnTitle: string;
  openingPrayer: string;
  wardBusiness: string;
  stakeBusiness: boolean;
  stakeBusinessItems: string;
  sacramentHymnNumber: string;
  sacramentHymnTitle: string;
  speakers: SpeakerFormValues[];
  closingHymnNumber: string;
  closingHymnTitle: string;
  closingPrayer: string;
}

/**
 * Error messages keyed by field name, e.g. "presiding", "openingHymnNumber", or
 * "speakers.1.name" for the second speaker row.
 */
export type MeetingFormErrors = Partial<Record<string, string[]>>;

/** What createMeeting/updateMeeting return to useActionState. */
export interface MeetingFormState {
  message: string | null;
  errors: MeetingFormErrors;
  values?: MeetingFormValues;
}

export const initialMeetingFormState: MeetingFormState = { message: null, errors: {} };

/**
 * The form shows at least this many speaker rows. The server ignores blank rows, so these let
 * people fill in speakers even before JavaScript (and the "Add" button) is running.
 */
const MIN_SPEAKER_ROWS = 3;

function withBlankRows(speakers: SpeakerFormValues[]): SpeakerFormValues[] {
  const blanks = Math.max(MIN_SPEAKER_ROWS - speakers.length, 0);
  return [...speakers, ...Array.from({ length: blanks }, () => ({ name: '', topic: '', type: 'speaker' }))];
}

export const EMPTY_MEETING_VALUES: MeetingFormValues = {
  date: '',
  meetingType: 'regular',
  presiding: '',
  conducting: '',
  announcements: '',
  openingHymnNumber: '',
  openingHymnTitle: '',
  openingPrayer: '',
  wardBusiness: '',
  stakeBusiness: false,
  stakeBusinessItems: '',
  sacramentHymnNumber: '',
  sacramentHymnTitle: '',
  speakers: withBlankRows([]),
  closingHymnNumber: '',
  closingHymnTitle: '',
  closingPrayer: '',
};

const lines = (items: string[] | undefined) => (items ?? []).join('\n');

/** A stored meeting as form values, to pre-fill the edit form. */
export function toFormValues(m: SacramentMeeting): MeetingFormValues {
  return {
    date: m.date,
    meetingType: m.meetingType,
    presiding: m.presiding,
    conducting: m.conducting,
    announcements: lines(m.announcements),
    openingHymnNumber: String(m.openingHymn.number),
    openingHymnTitle: m.openingHymn.title,
    openingPrayer: m.openingPrayer,
    wardBusiness: lines(m.wardBusiness.map((b) => b.description)),
    stakeBusiness: m.stakeBusiness,
    stakeBusinessItems: lines(m.stakeBusinessItems?.map((b) => b.description)),
    sacramentHymnNumber: String(m.sacramentHymn.number),
    sacramentHymnTitle: m.sacramentHymn.title,
    speakers: withBlankRows(m.speakers.map(({ name, topic, type }) => ({ name, topic, type }))),
    closingHymnNumber: String(m.closingHymn.number),
    closingHymnTitle: m.closingHymn.title,
    closingPrayer: m.closingPrayer,
  };
}

/** Reads the submitted form. FormData values are untyped, so anything missing becomes "". */
export function readMeetingForm(formData: FormData): MeetingFormValues {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === 'string' ? value : '';
  };
  const all = (name: string) =>
    formData.getAll(name).map((v) => (typeof v === 'string' ? v : ''));

  // Speaker rows submit as parallel lists: the nth name, topic and type belong together.
  const names = all('speakerName');
  const topics = all('speakerTopic');
  const types = all('speakerType');

  return {
    date: text('date'),
    meetingType: text('meetingType'),
    presiding: text('presiding'),
    conducting: text('conducting'),
    announcements: text('announcements'),
    openingHymnNumber: text('openingHymnNumber'),
    openingHymnTitle: text('openingHymnTitle'),
    openingPrayer: text('openingPrayer'),
    wardBusiness: text('wardBusiness'),
    stakeBusiness: formData.get('stakeBusiness') === 'on',
    stakeBusinessItems: text('stakeBusinessItems'),
    sacramentHymnNumber: text('sacramentHymnNumber'),
    sacramentHymnTitle: text('sacramentHymnTitle'),
    speakers: names.map((name, i) => ({
      name,
      topic: topics[i] ?? '',
      type: types[i] ?? 'speaker',
    })),
    closingHymnNumber: text('closingHymnNumber'),
    closingHymnTitle: text('closingHymnTitle'),
    closingPrayer: text('closingPrayer'),
  };
}
