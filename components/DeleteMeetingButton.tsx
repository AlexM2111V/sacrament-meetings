"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { deleteMeeting } from "@/lib/actions";
import { MEETINGS_STATUS_ID } from "@/lib/meeting-form";
import { useHydrated } from "@/lib/use-hydrated";

const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-danger hover:bg-surface aria-disabled:cursor-wait aria-disabled:opacity-70";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      // aria-disabled instead of disabled, so the button keeps keyboard focus while deleting.
      aria-disabled={pending}
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
      className={buttonClass}
    >
      {pending ? "Deleting…" : "Delete"}
      {/* Several cards each have a Delete button, so name the meeting for screen readers. */}
      <span className="sr-only"> {label}</span>
    </button>
  );
}

// The focused Delete button disappears with its card, so focus moves to the list's status
// line instead. This can't simply run after `await deleteMeeting()`: deleting the last card on
// the last page makes the list redirect to the previous page, and then the action's promise
// never resolves. So the delete sets this flag, and StatusFocusAfterDelete (rendered next to
// the status line) focuses it when the list re-renders.
let focusStatusPending = false;

/** Rendered by the meetings list. `token` changes whenever the list's content does. */
export function StatusFocusAfterDelete({ token }: { token: string }) {
  useEffect(() => {
    if (!focusStatusPending) return;
    const status = document.getElementById(MEETINGS_STATUS_ID);
    if (!status) return;
    focusStatusPending = false;
    status.focus();
  }, [token]);
  return null;
}

async function deleteAndKeepFocus(formData: FormData) {
  focusStatusPending = true;
  try {
    await deleteMeeting(formData);
  } catch (error) {
    focusStatusPending = false; // the error page takes over
    throw error;
  }
}

/**
 * A small form that submits the meeting id to the deleteMeeting Server Action after a
 * confirm dialog. Before JavaScript runs it is a link to a confirmation page instead, so a
 * delete is always confirmed.
 */
export default function DeleteMeetingButton({ id, label }: { id: number; label: string }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Link href={`/meetings/${id}/delete`} className={buttonClass}>
        Delete<span className="sr-only"> {label}</span>
      </Link>
    );
  }

  return (
    <form
      action={deleteAndKeepFocus}
      onSubmit={(event) => {
        // Cancelling the confirmation stops React from running the action.
        if (!window.confirm(`Delete the ${label}? This can't be undone.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton label={label} />
    </form>
  );
}
