"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState, type ReactNode } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import {
  MEETING_TYPE_LABELS,
  type MeetingFormErrors,
  type MeetingFormState,
  type MeetingFormValues,
  type SpeakerFormValues,
} from "@/lib/meeting-form";

// The meeting form shared by the create and edit pages. Each page owns its useActionState
// call (see create-meeting-form.tsx / edit-meeting-form.tsx) and passes the result here.
//
// Accessibility:
// - Every control has a <label htmlFor> matching its id.
// - Each field points at its error container with aria-describedby; containers use
//   aria-live="polite" so screen readers announce errors as they appear.
// - After a failed submit, focus moves to the first invalid field.
//
// A failed submission keeps what the user typed: with JavaScript the form skips React's
// automatic reset (see onSubmit below); without it, the server re-renders the form with the
// values it echoes back, which the inputs use as defaultValue.

const controlClass =
  "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground aria-invalid:border-danger";
const labelClass = "block text-sm font-medium";
const hintClass = "mt-1 text-xs text-muted";
const legendClass = "mb-3 text-sm font-semibold uppercase tracking-wide text-muted";

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  return (
    <div id={`${id}-error`} aria-live="polite" aria-atomic="true">
      {messages?.map((message) => (
        <p key={message} className="mt-1 text-sm text-danger">
          {message}
        </p>
      ))}
    </div>
  );
}

/** aria-describedby / aria-invalid for a control with an optional hint and an error container. */
function describe(id: string, messages: string[] | undefined, hint?: string) {
  return {
    "aria-describedby": [hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(" "),
    "aria-invalid": messages?.length ? true : undefined,
  } as const;
}

/** Form fields whose value is plain text (not the speaker list or the checkbox). */
type TextKey = {
  [K in keyof MeetingFormValues]: MeetingFormValues[K] extends string ? K : never;
}[keyof MeetingFormValues];

interface FieldProps {
  name: TextKey;
  label: string;
  values: MeetingFormValues;
  errors: MeetingFormErrors;
  hint?: string;
  className?: string;
}

function TextField({
  name,
  label,
  values,
  errors,
  hint,
  className,
  type = "text",
  required = true,
  ...inputProps
}: FieldProps & {
  type?: "text" | "date";
  required?: boolean;
  inputMode?: "numeric";
  pattern?: string;
  autoComplete?: string;
}) {
  const messages = errors[name];
  return (
    <div className={className}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={values[name]}
        className={controlClass}
        {...describe(name, messages, hint)}
        {...inputProps}
      />
      {hint && (
        <p id={`${name}-hint`} className={hintClass}>
          {hint}
        </p>
      )}
      <FieldError id={name} messages={messages} />
    </div>
  );
}

function LinesField({
  name,
  label,
  values,
  errors,
  hint,
  className,
  inactive = false,
}: FieldProps & {
  /** Hidden and disabled: not shown and not submitted, but keeps what was typed. */
  inactive?: boolean;
}) {
  const messages = errors[name];
  return (
    <div className={className} hidden={inactive}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        disabled={inactive}
        rows={3}
        defaultValue={values[name]}
        className={controlClass}
        {...describe(name, messages, hint)}
      />
      {hint && (
        <p id={`${name}-hint`} className={hintClass}>
          {hint}
        </p>
      )}
      <FieldError id={name} messages={messages} />
    </div>
  );
}

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-card border border-border p-4 sm:p-5">
      <legend className={`${legendClass} px-1`}>{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** A hymn's number and title, side by side. */
function HymnFields({
  prefix,
  label,
  values,
  errors,
}: {
  prefix: "openingHymn" | "sacramentHymn" | "closingHymn";
  label: string;
  values: MeetingFormValues;
  errors: MeetingFormErrors;
}) {
  return (
    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-[11rem_1fr]">
      {/* Text with a numeric keypad, not type="number": browsers submit an invalid number
          like "1e" as an empty string, which would hide what the user typed. */}
      <TextField
        name={`${prefix}Number`}
        label={`${label} number`}
        inputMode="numeric"
        pattern="[0-9]*"
        values={values}
        errors={errors}
      />
      <TextField name={`${prefix}Title`} label={`${label} title`} values={values} errors={errors} />
    </div>
  );
}

// ---- Speakers and musical numbers (a list the user can grow and shrink) ----

interface SpeakerRow {
  key: number;
  values: SpeakerFormValues;
  errors: { name?: string[]; topic?: string[]; type?: string[] };
}

function speakerRows(
  speakers: SpeakerFormValues[],
  errors: MeetingFormErrors,
  keys: (i: number) => number,
): SpeakerRow[] {
  return speakers.map((values, i) => ({
    key: keys(i),
    values,
    errors: {
      name: errors[`speakers.${i}.name`],
      topic: errors[`speakers.${i}.topic`],
      type: errors[`speakers.${i}.type`],
    },
  }));
}

/**
 * Each row stores `name` and `topic`. A speaker uses them as name (required) and topic; a
 * musical number uses them as performers and song, both optional, so "Musical number" alone
 * is a complete entry.
 */
const ROW_FIELDS = {
  speaker: {
    name: { label: "Name", placeholder: "e.g. Sister Navarro" },
    topic: { label: "Topic (optional)", placeholder: "e.g. Faith" },
  },
  "musical-number": {
    name: { label: "Performed by (optional)", placeholder: "e.g. Ward Choir" },
    topic: { label: "Song or hymn (optional)", placeholder: "e.g. Called to Serve" },
  },
} as const;

function rowFields(type: string) {
  return type === "musical-number" ? ROW_FIELDS["musical-number"] : ROW_FIELDS.speaker;
}

function SpeakersSection({ values, errors }: { values: MeetingFormValues; errors: MeetingFormErrors }) {
  const [rows, setRows] = useState(() => speakerRows(values.speakers, errors, (i) => i));
  const [nextKey, setNextKey] = useState(values.speakers.length);
  // Id of the control to focus after the list changes (the new row, or the Add button).
  const focusAfterRender = useRef<string | null>(null);

  // A submission came back: show the rows as the server echoed them, with their errors.
  // Rows keep their React keys by position, so inputs aren't remounted.
  const [source, setSource] = useState({ values, errors });
  if (source.values !== values || source.errors !== errors) {
    setSource({ values, errors });
    setRows(speakerRows(values.speakers, errors, (i) => rows[i]?.key ?? nextKey + i));
    setNextKey(nextKey + values.speakers.length);
  }

  useEffect(() => {
    if (focusAfterRender.current) {
      document.getElementById(focusAfterRender.current)?.focus();
      focusAfterRender.current = null;
    }
  });

  function addRow() {
    focusAfterRender.current = `speaker-${rows.length}-type`;
    setRows([...rows, { key: nextKey, values: { name: "", topic: "", type: "speaker" }, errors: {} }]);
    setNextKey(nextKey + 1);
  }

  function removeRow(key: number) {
    focusAfterRender.current = "add-speaker";
    setRows(rows.filter((row) => row.key !== key));
  }

  function setRowType(key: number, type: string) {
    setRows(rows.map((row) => (row.key === key ? { ...row, values: { ...row.values, type } } : row)));
  }

  const listErrors = errors.speakers;

  return (
    <fieldset className="rounded-card border border-border p-4 sm:p-5" aria-describedby="speakers-hint speakers-error">
      <legend className={`${legendClass} px-1`}>Speakers &amp; Music</legend>
      <p id="speakers-hint" className={`${hintClass} -mt-1 mb-3`}>
        In program order. A speaker needs a name. A musical number can stay as just “Musical
        number”, or add the song and who performs it. Blank speaker rows are skipped.
      </p>

      {rows.length > 0 && (
        <ol className="flex flex-col gap-3">
          {rows.map((row, i) => {
            const id = (field: string) => `speaker-${i}-${field}`;
            const fields = rowFields(row.values.type);
            return (
              <li key={row.key}>
                <fieldset className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[11rem_1fr_1fr_auto] sm:items-start">
                  <legend className="sr-only">Program item {i + 1}</legend>
                  <div>
                    <label htmlFor={id("type")} className={labelClass}>
                      Type
                    </label>
                    <select
                      id={id("type")}
                      name="speakerType"
                      // Controlled for the same reason as the meeting type select.
                      value={row.values.type}
                      onChange={(event) => setRowType(row.key, event.target.value)}
                      className={controlClass}
                      {...describe(id("type"), row.errors.type)}
                    >
                      <option value="speaker">Speaker</option>
                      <option value="musical-number">Musical number</option>
                    </select>
                    <FieldError id={id("type")} messages={row.errors.type} />
                  </div>
                  <div>
                    <label htmlFor={id("name")} className={labelClass}>
                      {fields.name.label}
                    </label>
                    <input
                      id={id("name")}
                      name="speakerName"
                      defaultValue={row.values.name}
                      placeholder={fields.name.placeholder}
                      className={controlClass}
                      {...describe(id("name"), row.errors.name)}
                    />
                    <FieldError id={id("name")} messages={row.errors.name} />
                  </div>
                  <div>
                    <label htmlFor={id("topic")} className={labelClass}>
                      {fields.topic.label}
                    </label>
                    <input
                      id={id("topic")}
                      name="speakerTopic"
                      defaultValue={row.values.topic}
                      placeholder={fields.topic.placeholder}
                      className={controlClass}
                      {...describe(id("topic"), row.errors.topic)}
                    />
                    <FieldError id={id("topic")} messages={row.errors.topic} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface sm:mt-6"
                  >
                    Remove<span className="sr-only"> program item {i + 1}</span>
                  </button>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}

      <button
        id="add-speaker"
        type="button"
        onClick={addRow}
        className="mt-3 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:bg-surface"
      >
        + Add speaker or musical number
      </button>
      <FieldError id="speakers" messages={listErrors} />
    </fieldset>
  );
}

// ---- The form ----

const MEETING_TYPE_HINT = "The Business fields below change with the meeting type.";

export default function MeetingForm({
  state,
  formAction,
  isPending,
  initialValues,
  submitLabel,
}: {
  state: MeetingFormState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  initialValues: MeetingFormValues;
  submitLabel: string;
}) {
  const values = state.values ?? initialValues;
  const errors = state.errors;
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();

  // The Business fields depend on the meeting type. Follow the select as the user changes it,
  // and reset to the server's echoed values after a submission.
  const [meetingType, setMeetingType] = useState(values.meetingType);
  const [typeSource, setTypeSource] = useState(values);
  if (typeSource !== values) {
    setTypeSource(values);
    setMeetingType(values.meetingType);
  }
  const isStake = meetingType === "stake";
  // Stake conferences list stake business items; other meetings list ward business plus the
  // stake business checkbox. Without JavaScript every field shows, and the server rejects
  // the list that doesn't match the type.
  const wardInactive = hydrated && isStake;
  const stakeInactive = hydrated && !isStake;

  // After a failed submit, move focus to the first invalid field (or the form message).
  useEffect(() => {
    if (!state.message) return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (firstInvalid ?? messageRef.current)?.focus();
  }, [state]);

  const field = { values, errors };

  return (
    <form
      ref={formRef}
      // Without JavaScript the browser posts straight to the Server Action.
      action={formAction}
      // With JavaScript, dispatch the action ourselves. React resets a form after running its
      // action prop, which would wipe what the user typed and snap <select>s back to their
      // first value even when they're controlled. Dispatching it manually skips that reset.
      onSubmit={(event) => {
        event.preventDefault();
        if (isPending) return;
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
    >
      <p className="text-sm text-muted">All fields are required unless marked optional.</p>

      <Section legend="Meeting">
        <TextField name="date" label="Date" type="date" hint="Meetings are held on Sundays." {...field} />
        <div>
          <label htmlFor="meetingType" className={labelClass}>
            Meeting type
          </label>
          <select
            id="meetingType"
            name="meetingType"
            required
            // Controlled: React's form reset would put an uncontrolled <select> back to its
            // first default, losing the type the server echoed after a failed submit.
            value={meetingType}
            onChange={(event) => setMeetingType(event.target.value)}
            className={controlClass}
            {...describe("meetingType", errors.meetingType, MEETING_TYPE_HINT)}
          >
            {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p id="meetingType-hint" className={hintClass}>
            {MEETING_TYPE_HINT}
          </p>
          <FieldError id="meetingType" messages={errors.meetingType} />
        </div>
        <TextField name="presiding" label="Presiding" autoComplete="off" {...field} />
        <TextField name="conducting" label="Conducting" autoComplete="off" {...field} />
        <LinesField
          name="announcements"
          label="Announcements"
          hint="Optional. One announcement per line."
          className="sm:col-span-2"
          {...field}
        />
      </Section>

      <Section legend="Opening">
        <HymnFields prefix="openingHymn" label="Opening hymn" {...field} />
        <TextField name="openingPrayer" label="Opening prayer" className="sm:col-span-2" {...field} />
      </Section>

      <Section legend="Business">
        <LinesField
          name="wardBusiness"
          label="Ward business"
          hint="Optional. Ward meetings only. One item per line, e.g. “Sustain: Brother Quispe as Sunday School teacher”."
          className={hydrated ? "sm:col-span-2" : undefined}
          inactive={wardInactive}
          {...field}
        />
        <LinesField
          name="stakeBusinessItems"
          label="Stake business items"
          hint="Optional. Stake conferences only. One item per line."
          className={hydrated ? "sm:col-span-2" : undefined}
          inactive={stakeInactive}
          {...field}
        />
        <div className="flex items-start gap-2 sm:col-span-2" hidden={wardInactive}>
          <input
            id="stakeBusiness"
            name="stakeBusiness"
            type="checkbox"
            disabled={wardInactive}
            defaultChecked={values.stakeBusiness}
            className="mt-1 h-4 w-4 accent-primary"
            aria-describedby="stakeBusiness-hint stakeBusiness-error"
          />
          <div>
            <label htmlFor="stakeBusiness" className="text-sm font-medium">
              Stake business will be conducted
            </label>
            <p id="stakeBusiness-hint" className={hintClass}>
              Ward meetings only. Adds “Stake business” to the ward business list.
            </p>
            <FieldError id="stakeBusiness" messages={errors.stakeBusiness} />
          </div>
        </div>
      </Section>

      <Section legend="Sacrament">
        <HymnFields prefix="sacramentHymn" label="Sacrament hymn" {...field} />
      </Section>

      <SpeakersSection values={values} errors={errors} />

      <Section legend="Closing">
        <HymnFields prefix="closingHymn" label="Closing hymn" {...field} />
        <TextField name="closingPrayer" label="Closing prayer" className="sm:col-span-2" {...field} />
      </Section>

      <div
        ref={messageRef}
        tabIndex={-1}
        id="form-message"
        aria-live="polite"
        aria-atomic="true"
        className="focus:outline-none"
      >
        {state.message && (
          <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">{state.message}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href="/meetings" className="rounded-md border border-border px-4 py-2 hover:bg-surface">
          Cancel
        </Link>
        <button
          type="submit"
          // aria-disabled instead of disabled, so the button keeps keyboard focus while saving.
          aria-disabled={isPending}
          onClick={(event) => {
            if (isPending) event.preventDefault(); // no double submit
          }}
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
