import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentMeeting } from "@/lib/meetings-db";

// This page only decides where to redirect, so it has no UI worth showing early.
// Let navigation wait for the server instead of requiring an instant shell.
export const instant = false;

export default async function CurrentMeetingPage() {
  // "Today" must be evaluated per request, not at build time.
  await connection();
  const meeting = await getCurrentMeeting();

  // Most recent Sunday's meeting, or the full list when that Sunday has no program.
  redirect(meeting ? `/meetings/${meeting.id}` : "/meetings");
}
