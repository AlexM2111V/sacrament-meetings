import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMeeting } from "@/lib/actions";
import {
  formatMeetingDate,
  getMeetingById,
  MEETING_TYPE_LABELS,
  parseMeetingId,
} from "@/lib/meetings-db";

export const metadata: Metadata = { title: "Delete Meeting" };

// Confirmation step for deleting without JavaScript. With JavaScript, the Delete button on each
// meeting card asks with a confirm dialog instead and never opens this page.
export default async function DeleteMeetingPage({ params }: PageProps<"/meetings/[id]/delete">) {
  const { id: rawId } = await params;
  const id = parseMeetingId(rawId);
  const meeting = id === null ? null : await getMeetingById(id);

  if (!meeting) notFound();

  return (
    <div className="mx-auto w-full max-w-prose rounded-card border border-border bg-surface/60 p-6 text-center">
      <h1 className="text-xl font-semibold">Delete this meeting?</h1>
      <p className="mt-2 text-muted">
        The {MEETING_TYPE_LABELS[meeting.meetingType]} on {formatMeetingDate(meeting.date)} will
        be permanently deleted. This can&apos;t be undone.
      </p>
      <form action={deleteMeeting} className="mt-4 flex flex-wrap justify-center gap-3">
        <input type="hidden" name="id" value={meeting.id} />
        {/* Tells deleteMeeting to return to the list, since this page has nothing to refresh. */}
        <input type="hidden" name="from" value="confirm-page" />
        <Link href="/meetings" className="rounded-md border border-border px-4 py-2 hover:bg-surface">
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-md border border-danger px-4 py-2 font-medium text-danger hover:bg-surface"
        >
          Delete meeting
        </button>
      </form>
    </div>
  );
}
