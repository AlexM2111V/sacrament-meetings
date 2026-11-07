import type { Metadata } from "next";
import { Suspense } from "react";
import MeetingCard from "@/components/MeetingCard";
import { fetchMeetings } from "@/lib/api-client";
import Loading from "./loading";

export const metadata: Metadata = { title: "All Meetings" };

async function MeetingList() {
  const meetings = await fetchMeetings();

  if (meetings.length === 0) {
    return <p className="text-muted">No meetings scheduled yet.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {meetings.map((m) => (
        <li key={m.id}>
          <MeetingCard meeting={m} />
        </li>
      ))}
    </ul>
  );
}

export default function MeetingsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">All Meetings</h1>
      {/* The API fetch happens per request, so it streams in behind the loading skeleton. */}
      <Suspense fallback={<Loading />}>
        <MeetingList />
      </Suspense>
    </>
  );
}
