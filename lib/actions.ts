'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as db from './meetings-db';
import {
  readMeetingForm,
  type MeetingFormErrors,
  type MeetingFormState,
  type MeetingFormValues,
} from './meeting-form';

// Server Actions for creating, updating and deleting meetings.
// Server Actions are reachable by direct POST requests, not only through the forms, so every
// value is validated here. Authentication arrives in Week 05; add the check at the top of
// each action then.

/** What createMeeting/updateMeeting return to the form's useActionState. */
export type State = MeetingFormState;

// ---- Validation ----

const MAX_TEXT = 120;
const MAX_LINE = 300;
const MAX_LIST_ITEMS = 30;
const MAX_SPEAKERS = 12;
const MAX_SPEAKER_ROWS = 50;

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(MAX_TEXT, `${label} must be ${MAX_TEXT} characters or fewer.`);

/** A hymn number typed as text: required, a whole number from 1 to 9999. */
const hymnNumber = (label: string) =>
  z
    .string()
    .trim()
    // abort: an empty field gets only this message, not the whole-number one too.
    .refine((value) => value !== '', { message: `Enter the ${label} number.`, abort: true })
    .regex(/^\d+$/, `The ${label} number must be a whole number.`)
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1, `The ${label} number must be at least 1.`)
        .max(9999, `The ${label} number must be 9999 or lower.`)
    );

/** A textarea with one item per line → the non-blank lines. */
const lineList = (label: string) =>
  z
    .string()
    .transform((text) =>
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .pipe(
      z
        .array(z.string().max(MAX_LINE, `Each ${label} line must be ${MAX_LINE} characters or fewer.`))
        .max(MAX_LIST_ITEMS, `List at most ${MAX_LIST_ITEMS} ${label} items.`)
    );

const isSunday = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;
};

/**
 * Blank speaker rows are ignored rather than rejected (the form shows a few spare rows).
 * A blank musical number is kept: choosing "Musical number" is the entry itself.
 */
const isKeptSpeakerRow = (row: { name: string; topic: string; type: string }) =>
  row.type === 'musical-number' || row.name !== '' || row.topic !== '';

const SpeakerSchema = z.object({
  name: z.string().trim().max(MAX_TEXT, `Must be ${MAX_TEXT} characters or fewer.`),
  topic: z.string().trim().max(MAX_TEXT, `Must be ${MAX_TEXT} characters or fewer.`),
  type: z.enum(['speaker', 'musical-number'], { error: 'Choose speaker or musical number.' }),
});

const MeetingFormSchema = z
  .object({
    date: z
      .string()
      .trim()
      .superRefine((value, ctx) => {
        if (!value) ctx.addIssue({ code: 'custom', message: 'Choose the meeting date.' });
        else if (!db.isIsoDate(value)) ctx.addIssue({ code: 'custom', message: 'Enter a valid date.' });
        else if (!isSunday(value)) {
          ctx.addIssue({ code: 'custom', message: 'Sacrament meetings are held on Sundays. Choose a Sunday.' });
        }
      }),
    meetingType: z.enum(['regular', 'testimony', 'stake', 'general'], {
      error: 'Choose a meeting type.',
    }),
    presiding: requiredText('Presiding'),
    conducting: requiredText('Conducting'),
    announcements: lineList('announcement'),
    openingHymnNumber: hymnNumber('opening hymn'),
    openingHymnTitle: requiredText('Opening hymn title'),
    openingPrayer: requiredText('Opening prayer'),
    wardBusiness: lineList('ward business'),
    stakeBusiness: z.boolean(),
    stakeBusinessItems: lineList('stake business'),
    sacramentHymnNumber: hymnNumber('sacrament hymn'),
    sacramentHymnTitle: requiredText('Sacrament hymn title'),
    speakers: z
      .array(SpeakerSchema)
      // A loose cap on raw rows, so a crafted request can't send thousands.
      .max(MAX_SPEAKER_ROWS, `Remove some rows: the form accepts at most ${MAX_SPEAKER_ROWS}.`)
      .superRefine((rows, ctx) => {
        // The real limit counts only rows that will be saved, not blank spare rows.
        if (rows.filter(isKeptSpeakerRow).length > MAX_SPEAKERS) {
          ctx.addIssue({
            code: 'custom',
            message: `List at most ${MAX_SPEAKERS} speakers and musical numbers.`,
          });
        }
        rows.forEach((row, i) => {
          // A speaker needs a name; the topic is optional. A musical number needs nothing:
          // the song and the performers are both optional.
          if (row.type === 'speaker' && !row.name && row.topic) {
            ctx.addIssue({ code: 'custom', path: [i, 'name'], message: 'Enter the speaker’s name.' });
          }
        });
      })
      .transform((rows) => rows.filter(isKeptSpeakerRow)),
    closingHymnNumber: hymnNumber('closing hymn'),
    closingHymnTitle: requiredText('Closing hymn title'),
    closingPrayer: requiredText('Closing prayer'),
  })
  // The program shows ward business for ward meetings and stake business items for stake
  // conferences (see MeetingDetail). Reject the other list instead of saving items that
  // would never appear. Runs once the fields above are valid.
  .superRefine((f, ctx) => {
    if (f.meetingType === 'stake' && f.wardBusiness.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['wardBusiness'],
        message:
          'Stake conferences show stake business items, not ward business. Move these lines to Stake business items or change the meeting type.',
      });
    }
    if (f.meetingType !== 'stake' && f.stakeBusinessItems.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['stakeBusinessItems'],
        message:
          'Stake business items only appear for stake conferences. Clear them, or check “Stake business will be conducted” instead.',
      });
    }
  })
  .transform(
    (f): db.MeetingInput => ({
      date: f.date,
      meetingType: f.meetingType,
      presiding: f.presiding,
      conducting: f.conducting,
      announcements: f.announcements,
      openingHymn: { number: f.openingHymnNumber, title: f.openingHymnTitle },
      openingPrayer: f.openingPrayer,
      wardBusiness: f.wardBusiness.map((description) => ({ description })),
      stakeBusiness: f.stakeBusiness,
      stakeBusinessItems: f.stakeBusinessItems.map((description) => ({ description })),
      sacramentHymn: { number: f.sacramentHymnNumber, title: f.sacramentHymnTitle },
      speakers: f.speakers,
      closingHymn: { number: f.closingHymnNumber, title: f.closingHymnTitle },
      closingPrayer: f.closingPrayer,
    })
  );

const MeetingIdSchema = z.coerce.number().int().positive();

/**
 * Zod issues → messages keyed by form field name. Speaker rows keep their row index
 * ("speakers.2.name"); every other field uses its top-level name ("announcements").
 */
function fieldErrors(error: z.ZodError): MeetingFormErrors {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const [field, index, subfield] = issue.path;
    const key =
      field === 'speakers' && typeof index === 'number' && subfield !== undefined
        ? `speakers.${index}.${String(subfield)}`
        : String(field ?? 'form');
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

const INVALID_MESSAGE = 'Some fields need attention. Fix the errors below and submit again.';
const DUPLICATE_DATE_MESSAGE = 'Another meeting is already scheduled on this date.';

function invalid(values: MeetingFormValues, errors: MeetingFormErrors): State {
  return { message: INVALID_MESSAGE, errors, values };
}

// ---- Actions ----
// redirect() works by throwing, so it is called after the try...catch, never inside it.

export async function createMeeting(prevState: State, formData: FormData): Promise<State> {
  const values = readMeetingForm(formData);
  const parsed = MeetingFormSchema.safeParse(values);
  if (!parsed.success) return invalid(values, fieldErrors(parsed.error));

  let meetingId: number;
  try {
    meetingId = (await db.addMeeting(parsed.data)).id;
  } catch (error) {
    if (db.isDuplicateDateError(error)) return invalid(values, { date: [DUPLICATE_DATE_MESSAGE] });
    console.error('Database error: failed to create meeting.', error);
    throw new Error('Failed to create the meeting. Please try again later.');
  }

  revalidatePath('/meetings');
  // Clears any cached title for this id (e.g. a "Meeting not found" cached before it existed).
  revalidatePath(`/meetings/${meetingId}`);
  redirect('/meetings');
}

/** Bound to a meeting id by the edit page: updateMeeting.bind(null, id). */
export async function updateMeeting(
  id: number,
  prevState: State,
  formData: FormData
): Promise<State> {
  // The bound id travels through the browser, so it is checked like any other input.
  const meetingId = MeetingIdSchema.safeParse(id);
  if (!meetingId.success) throw new Error('Invalid meeting id.');

  const values = readMeetingForm(formData);
  const parsed = MeetingFormSchema.safeParse(values);
  if (!parsed.success) return invalid(values, fieldErrors(parsed.error));

  let updated;
  try {
    updated = await db.updateMeeting(meetingId.data, parsed.data);
  } catch (error) {
    if (db.isDuplicateDateError(error)) return invalid(values, { date: [DUPLICATE_DATE_MESSAGE] });
    console.error(`Database error: failed to update meeting ${meetingId.data}.`, error);
    throw new Error('Failed to update the meeting. Please try again later.');
  }

  if (!updated) {
    return { message: 'This meeting no longer exists. It may have been deleted.', errors: {}, values };
  }

  revalidatePath('/meetings');
  revalidatePath(`/meetings/${meetingId.data}`);
  redirect('/meetings');
}

/** Submitted by the delete button on each meeting card, with the meeting id in a hidden field. */
export async function deleteMeeting(formData: FormData): Promise<void> {
  const meetingId = MeetingIdSchema.safeParse(formData.get('id'));
  if (!meetingId.success) throw new Error('Invalid meeting id.');

  try {
    await db.deleteMeeting(meetingId.data);
  } catch (error) {
    console.error(`Database error: failed to delete meeting ${meetingId.data}.`, error);
    throw new Error('Failed to delete the meeting. Please try again later.');
  }

  revalidatePath('/meetings');
  revalidatePath(`/meetings/${meetingId.data}`);

  // From a meeting card: no redirect, so the list re-renders in place and keeps the
  // visitor's search and page. From the confirmation page (no JavaScript): back to the list.
  if (formData.get('from') === 'confirm-page') redirect('/meetings');
}
