import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateMeeting } from "@/lib/actions";
import { toFormValues } from "@/lib/meeting-form";
import { formatMeetingDate, getMeetingById, parseMeetingId } from "@/lib/meetings-db";
import EditMeetingForm from "./edit-meeting-form";

export const metadata: Metadata = { title: "Edit Meeting" };

// loading.tsx shows a skeleton while the meeting loads. A missing meeting renders the
// not-found.tsx beside this file (status 200 with noindex; see the note in proxy.ts).

export default async function EditMeetingPage({ params }: PageProps<"/meetings/[id]/edit">) {
  const { id: rawId } = await params;
  const id = parseMeetingId(rawId);
  const meeting = id === null ? null : await getMeetingById(id);

  if (!meeting) notFound();

  // The id comes from the route segment; the form submits to this bound action.
  const updateMeetingWithId = updateMeeting.bind(null, meeting.id);

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Edit Meeting</h1>
        <p className="mt-1 text-muted">{formatMeetingDate(meeting.date)}</p>
      </div>
      <EditMeetingForm action={updateMeetingWithId} initialValues={toFormValues(meeting)} />
    </>
  );
}
