import Link from "next/link";
import type { SacramentMeeting } from "@/lib/types";
import { formatMeetingDate, MEETING_TYPE_LABELS } from "@/lib/meetings-db";

function summary(meeting: SacramentMeeting): string {
  if (meeting.meetingType === "testimony") return "Testimonies from the congregation";
  const speakers = meeting.speakers.filter((s) => s.type === "speaker");
  if (speakers.length === 0) return "No speakers assigned";
  return `Speakers: ${speakers.map((s) => s.name).join(", ")}`;
}

export default function MeetingCard({ meeting }: { meeting: SacramentMeeting }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block rounded-card border border-border bg-surface/40 p-5 transition-colors hover:border-accent"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {MEETING_TYPE_LABELS[meeting.meetingType]}
      </p>
      <h2 className="mt-1 text-lg font-semibold">{formatMeetingDate(meeting.date)}</h2>
      <p className="mt-2 text-sm text-muted">
        Conducting: {meeting.conducting}
      </p>
      <p className="mt-1 text-sm text-muted">{summary(meeting)}</p>
    </Link>
  );
}
