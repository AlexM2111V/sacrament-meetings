import Link from "next/link";
import type { SacramentMeeting } from "@/lib/types";
import { formatMeetingDate, MEETING_TYPE_LABELS } from "@/lib/meetings-db";
import DeleteMeetingButton from "./DeleteMeetingButton";

function summary(meeting: SacramentMeeting): string {
  if (meeting.meetingType === "testimony") return "Testimonies from the congregation";
  const speakers = meeting.speakers.filter((s) => s.type === "speaker");
  if (speakers.length === 0) return "No speakers assigned";
  return `Speakers: ${speakers.map((s) => s.name).join(", ")}`;
}

export default function MeetingCard({ meeting }: { meeting: SacramentMeeting }) {
  const date = formatMeetingDate(meeting.date);
  // e.g. "meeting on Sunday, November 8, 2026" — names the card's buttons for screen readers.
  const label = `meeting on ${date}`;

  return (
    <article className="flex h-full flex-col rounded-card border border-border bg-surface/40 transition-colors hover:border-accent">
      <Link href={`/meetings/${meeting.id}`} className="block flex-1 rounded-t-card p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {MEETING_TYPE_LABELS[meeting.meetingType]}
        </p>
        <h2 className="mt-1 text-lg font-semibold">{date}</h2>
        <p className="mt-2 text-sm text-muted">
          Conducting: {meeting.conducting}
        </p>
        <p className="mt-1 text-sm text-muted">{summary(meeting)}</p>
      </Link>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-3 text-sm print:hidden">
        <Link
          href={`/meetings/${meeting.id}/edit`}
          className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
        >
          Edit<span className="sr-only"> {label}</span>
        </Link>
        <DeleteMeetingButton id={meeting.id} label={label} />
      </div>
    </article>
  );
}
