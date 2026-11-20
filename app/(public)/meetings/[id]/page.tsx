import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import MeetingDetail from "@/components/MeetingDetail";
import PrintButton from "@/components/PrintButton";
import { fetchMeeting } from "@/lib/api-client";
import {
  formatMeetingDate,
  getMeetingById,
  getMeetingIds,
  MEETING_TYPE_LABELS,
  parseMeetingId,
} from "@/lib/meetings-db";

export async function generateStaticParams() {
  const ids = await getMeetingIds();
  return ids.map((id) => ({ id: String(id) }));
}

async function loadMeeting(rawId: string) {
  const id = parseMeetingId(rawId);
  return id === null ? undefined : getMeetingById(id);
}

/**
 * Cached so the title and description are prerendered into <head>. Uncached, they would
 * stream into <body>, where crawlers that don't run JavaScript (and Lighthouse) miss them.
 * The meeting Server Actions call revalidatePath(`/meetings/${id}`), which clears this.
 */
async function meetingMetadata(rawId: string): Promise<Metadata> {
  "use cache";
  const meeting = await loadMeeting(rawId);
  if (!meeting) return { title: "Meeting not found" };
  const date = formatMeetingDate(meeting.date);
  return {
    title: date,
    description: `${MEETING_TYPE_LABELS[meeting.meetingType]} program for ${date}: presiding, conducting, hymns, prayers and speakers.`,
  };
}

export async function generateMetadata({ params }: PageProps<"/meetings/[id]">): Promise<Metadata> {
  return meetingMetadata((await params).id);
}

function MeetingSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-prose animate-pulse space-y-4">
      <span className="sr-only">Loading meeting…</span>
      <div className="mx-auto h-8 w-64 rounded bg-surface" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-6 rounded bg-surface/60" />
      ))}
    </div>
  );
}

async function MeetingContent({
  params,
  searchParams,
}: Pick<PageProps<"/meetings/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const { print } = await searchParams;
  const meeting = await fetchMeeting(id);

  if (!meeting) notFound();

  const printMode = print === "1" || print === "true";

  return (
    <>
      <div className="flex items-center justify-end gap-2 text-sm print:hidden">
        <div className="flex gap-2">
          {!printMode && (
            <Link
              href={`/meetings/${meeting.id}/edit`}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
            >
              Edit meeting
            </Link>
          )}
          <Link
            href={printMode ? `/meetings/${meeting.id}` : `/meetings/${meeting.id}?print=1`}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
          >
            {printMode ? "Exit print view" : "Print view"}
          </Link>
          {printMode && <PrintButton />}
        </div>
      </div>
      <MeetingDetail meeting={meeting} printMode={printMode} />
    </>
  );
}

export default function MeetingPage({ params, searchParams }: PageProps<"/meetings/[id]">) {
  // params/searchParams are URL data; reading them inside Suspense keeps navigation instant.
  return (
    <Suspense fallback={<MeetingSkeleton />}>
      <MeetingContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
