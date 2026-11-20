import { NextResponse, type NextRequest } from "next/server";
import {
  getCurrentMeeting,
  getMeetingById,
  getMeetingsTotalPages,
  parseMeetingId,
  toPageNumber,
  toTimeframe,
} from "@/lib/meetings-db";

// Runs before the page renders, so it can answer with real HTTP status codes. Pages
// stream their shell first, which locks the status to 200 before the page can decide.
//
// The proxy and the pages read the same Neon database.

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // /meetings?page=N for a page that doesn't exist → 307 to the nearest real page.
  if (pathname === "/meetings") {
    const pages = searchParams.getAll("page");
    if (pages.length === 0) return NextResponse.next();

    const query = searchParams.get("query")?.trim() ?? "";
    const when = toTimeframe(searchParams.get("when")); // pages are counted within the tab
    const totalPages = await getMeetingsTotalPages(query, when);
    const page = String(toPageNumber(pages[0], totalPages));
    if (pages.length === 1 && pages[0] === page) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.searchParams.set("page", page); // also collapses ?page=1&page=2 into one value
    return NextResponse.redirect(url, 307);
  }

  // Direct visits get a real 307 instead of a streamed 200 with a delayed meta refresh.
  if (pathname === "/meetings/current") {
    const meeting = await getCurrentMeeting();
    const target = meeting ? `/meetings/${meeting.id}` : "/meetings";
    return NextResponse.redirect(new URL(target, request.url), 307);
  }

  // /meetings/new is the admin create page, not a meeting id.
  if (pathname === "/meetings/new") return NextResponse.next();

  // /meetings/:id: unknown or malformed ids get a real 404 (Next renders the not-found page).
  //
  // /meetings/:id/edit and /meetings/:id/delete are deliberately not matched. Their pages call
  // notFound() and render their own not-found.tsx, which the assignment requires. The cost is
  // a 200 status (with a noindex tag) for those misses: the page render overrides a status
  // set here, and rewriting to an unmatched route would show the app-wide 404 page instead.
  const id = parseMeetingId(pathname.slice("/meetings/".length));
  if (id === null || !(await getMeetingById(id))) {
    return NextResponse.rewrite(new URL("/__meeting-not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/meetings", "/meetings/:id"],
};
