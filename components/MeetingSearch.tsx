"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const inputClassName =
  "w-full rounded-card border border-border bg-surface/40 px-4 py-2.5 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function MeetingSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();
  const query = searchParams.get("query") ?? "";

  const inputRef = useRef<HTMLInputElement>(null);
  // The query this component last wrote to the URL. A URL query that differs from it
  // came from Back/Forward or a link, so the input text must be updated to match.
  const lastWrittenQuery = useRef(query);

  // Waits 300 ms after the last keystroke, so typing doesn't query the database per key.
  // push (not replace) gives each search its own history entry, so Back returns to it.
  const handleSearch = useDebouncedCallback((input: string) => {
    const term = input.trim(); // "   " is not a search
    if (term === lastWrittenQuery.current) return; // only spaces were added or removed
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // always reset to page 1 on a new search
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    lastWrittenQuery.current = term;
    push(`${pathname}?${params.toString()}`);
  }, 300);

  useEffect(() => {
    if (query === lastWrittenQuery.current) return;
    handleSearch.cancel(); // drop any half-typed search; the URL wins
    lastWrittenQuery.current = query;
    if (inputRef.current) inputRef.current.value = query;
  }, [query, handleSearch]);

  return (
    <div className="flex flex-col gap-2">
      {/* A visible label stays on screen after the placeholder disappears (WCAG 3.3.2). */}
      <label htmlFor="meeting-search" className="text-sm font-medium">
        Search meetings
      </label>
      <input
        ref={inputRef}
        id="meeting-search"
        type="search"
        placeholder="Search by speaker, leader, or meeting type..."
        defaultValue={query}
        onChange={(e) => handleSearch(e.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

/** Same size as the input, shown while the URL is being read (avoids a layout jump). */
export function MeetingSearchFallback() {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="meeting-search" className="text-sm font-medium">
        Search meetings
      </label>
      <input
        id="meeting-search"
        type="search"
        disabled
        placeholder="Search by speaker, leader, or meeting type..."
        className={inputClassName}
      />
    </div>
  );
}
