import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect, RedirectType } from "next/navigation";
import MeetingCard from "@/components/MeetingCard";
import { MeetingSearch, MeetingSearchFallback } from "@/components/MeetingSearch";
import { Pagination } from "@/components/Pagination";
import { getMeetings, getMeetingsCount, ITEMS_PER_PAGE, toPageNumber } from "@/lib/meetings-db";
import Loading from "./loading";

export const metadata: Metadata = { title: "All Meetings" };

type SearchParams = PageProps<"/meetings">["searchParams"];

/** First value of a URL parameter (?page=1&page=2 arrives as an array). */
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The current URL parameters with `page` replaced, e.g. "query=regular&page=1". */
function withPage(params: Awaited<SearchParams>, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  search.set("page", String(page));
  return search.toString();
}

async function MeetingList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = first(params.query)?.trim() ?? "";

  // The count comes first so the page number can be checked against pages that exist.
  const total = await getMeetingsCount(query);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const currentPage = toPageNumber(first(params.page), totalPages);

  // A page that doesn't exist (page=3 of 1, page=-1, page=abc) redirects to the nearest real
  // page, so the URL always matches what is shown. "replace" keeps the bad URL out of history.
  // proxy.ts already answers direct visits with a real 307; this covers anything that slips past it.
  if (params.page !== undefined && params.page !== String(currentPage)) {
    redirect(`/meetings?${withPage(params, currentPage)}`, RedirectType.replace);
  }
  const meetings = total > 0 ? await getMeetings(query, currentPage) : [];

  const noun = total === 1 ? "meeting" : "meetings";
  const verb = total === 1 ? "matches" : "match";
  const summary =
    total === 0
      ? query
        ? `No meetings match “${query}”.`
        : "No meetings scheduled yet."
      : query
        ? `${total} ${noun} ${verb} “${query}”.`
        : `${total} ${noun}.`;

  return (
    <div className="flex flex-col gap-6">
      {/* role="status" makes screen readers announce the result count after each search. */}
      <p role="status" className="text-center text-sm text-muted">
        {summary}
      </p>
      {meetings.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {meetings.map((m) => (
            <li key={m.id}>
              <MeetingCard meeting={m} />
            </li>
          ))}
        </ul>
      )}
      <Pagination totalPages={totalPages} currentPage={currentPage} />
    </div>
  );
}

export default function MeetingsPage({ searchParams }: PageProps<"/meetings">) {
  return (
    <>
      <h1 className="text-center text-2xl font-semibold">All Meetings</h1>
      {/* Both read the URL, which is only known per request, so each gets a Suspense boundary. */}
      <Suspense fallback={<MeetingSearchFallback />}>
        <MeetingSearch />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <MeetingList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
