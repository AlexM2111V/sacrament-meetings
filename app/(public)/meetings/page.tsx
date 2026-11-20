import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect, RedirectType } from "next/navigation";
import { connection } from "next/server";
import MeetingCard from "@/components/MeetingCard";
import { StatusFocusAfterDelete } from "@/components/DeleteMeetingButton";
import { MeetingSearch, MeetingSearchFallback } from "@/components/MeetingSearch";
import { Pagination } from "@/components/Pagination";
import {
  getMeetings,
  getMeetingsCountByTimeframe,
  ITEMS_PER_PAGE,
  toPageNumber,
  toTimeframe,
  type MeetingTimeframe,
} from "@/lib/meetings-db";
import { MEETINGS_STATUS_ID } from "@/lib/meeting-form";
import Loading from "./loading";

export const metadata: Metadata = { title: "All Meetings" };

type SearchParams = PageProps<"/meetings">["searchParams"];

/** First value of a URL parameter (?page=1&page=2 arrives as an array). */
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The current URL parameters minus the given keys. */
function paramsWithout(params: Awaited<SearchParams>, ...omit: string[]): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (omit.includes(key) || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  return search;
}

/** The current URL parameters with `page` replaced, e.g. "query=regular&page=1". */
function withPage(params: Awaited<SearchParams>, page: number): string {
  const search = paramsWithout(params, "page");
  search.set("page", String(page));
  return search.toString();
}

const TABS: { when: MeetingTimeframe; label: string }[] = [
  { when: "upcoming", label: "Upcoming" },
  { when: "past", label: "Past" },
];

/**
 * Links, not an ARIA tablist: each tab is its own URL (bookmarkable, Back works) and loads
 * a new list, which is navigation. aria-current marks the selected one.
 * Switching keeps the search text and starts at page 1. Upcoming is the default, so its
 * URL has no `when`.
 */
function TimeframeTabs({
  params,
  active,
  counts,
}: {
  params: Awaited<SearchParams>;
  active: MeetingTimeframe;
  counts: Record<MeetingTimeframe, number>;
}) {
  return (
    <nav aria-label="Meeting dates">
      <ul className="mx-auto flex w-fit rounded-card border border-border p-1 text-sm">
        {TABS.map(({ when, label }) => {
          const search = paramsWithout(params, "page", "when");
          if (when !== "upcoming") search.set("when", when);
          const qs = search.toString();
          const selected = when === active;
          return (
            <li key={when}>
              <Link
                href={qs ? `/meetings?${qs}` : "/meetings"}
                aria-current={selected ? "page" : undefined}
                className={`block rounded-md px-4 py-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {label} <span className={selected ? "opacity-80" : ""}>({counts[when]})</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

async function MeetingList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = first(params.query)?.trim() ?? "";
  const when = toTimeframe(first(params.when));

  // The tabs split on "today", which must be evaluated per request, not at build time.
  await connection();

  // The counts come first so the page number can be checked against pages that exist.
  const counts = await getMeetingsCountByTimeframe(query);
  const total = counts[when];
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const currentPage = toPageNumber(first(params.page), totalPages);

  // A page that doesn't exist (page=3 of 1, page=-1, page=abc) redirects to the nearest real
  // page, so the URL always matches what is shown. "replace" keeps the bad URL out of history.
  // proxy.ts already answers direct visits with a real 307; this covers anything that slips past it.
  if (params.page !== undefined && params.page !== String(currentPage)) {
    redirect(`/meetings?${withPage(params, currentPage)}`, RedirectType.replace);
  }
  const meetings = total > 0 ? await getMeetings(query, currentPage, when) : [];

  const noun = `${when} ${total === 1 ? "meeting" : "meetings"}`;
  const verb = total === 1 ? "matches" : "match";
  const summary =
    total === 0
      ? query
        ? `No ${when} meetings match “${query}”.`
        : when === "upcoming"
          ? "No upcoming meetings scheduled yet."
          : "No past meetings yet."
      : query
        ? `${total} ${noun} ${verb} “${query}”.`
        : `${total} ${noun}.`;

  return (
    <div className="flex flex-col gap-6">
      <TimeframeTabs params={params} active={when} counts={counts} />
      {/* role="status" makes screen readers announce the result count after each search. */}
      {/* tabIndex -1: focus lands here after a meeting card is deleted. */}
      <p
        id={MEETINGS_STATUS_ID}
        role="status"
        tabIndex={-1}
        className="text-center text-sm text-muted focus:outline-none"
      >
        {summary}
      </p>
      <StatusFocusAfterDelete token={`${when}|${query}|${currentPage}|${meetings.map((m) => m.id).join(",")}`} />
      {meetings.length > 0 && (
        // Two columns on wider screens, read left to right: 1 2 / 3 4. An odd last card
        // (the 5th) gets its own row, centered at the same width as the others. Phones: one column.
        <ul className="grid gap-4 sm:grid-cols-2">
          {meetings.map((m) => (
            <li
              key={m.id}
              className="sm:last:odd:col-span-2 sm:last:odd:w-[calc(50%-0.5rem)] sm:last:odd:justify-self-center"
            >
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
      <div className="flex flex-col items-center gap-3 sm:relative">
        <h1 className="text-center text-2xl font-semibold">All Meetings</h1>
        <Link
          href="/meetings/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2"
        >
          + New meeting
        </Link>
      </div>
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
