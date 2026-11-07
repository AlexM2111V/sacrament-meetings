import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMeeting, getMeetingById, parseMeetingId } from "@/lib/meetings-db";

// Runs before the page renders, so it can answer with real HTTP status codes. Pages
// stream their shell first, which locks the status to 200 before the page can decide.
//
// While data lives in memory, the proxy reads its own copy of lib/meetings-db.ts.
// Once meetings come from a database, both will read the same source.

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Direct visits get a real 307 instead of a streamed 200 with a delayed meta refresh.
  if (pathname === "/meetings/current") {
    const meeting = await getCurrentMeeting();
    const target = meeting ? `/meetings/${meeting.id}` : "/meetings";
    return NextResponse.redirect(new URL(target, request.url), 307);
  }

  // Unknown or malformed meeting ids get a real 404 (Next renders the not-found page).
  const id = parseMeetingId(pathname.slice("/meetings/".length));
  if (id === null || !(await getMeetingById(id))) {
    return NextResponse.rewrite(new URL("/__meeting-not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/meetings/:id"],
};
