"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

/**
 * Fallback UI for unexpected errors in the meetings routes, used by both
 * app/(public)/meetings/error.tsx and app/(admin)/meetings/error.tsx.
 *
 * "Try again" calls reset(), which clears the error boundary and re-renders the segment.
 * reset() alone re-uses the data that already failed, so router.refresh() runs first in the
 * same transition to re-fetch it from the server. (Next.js 16 also offers retry(), which
 * does both in one call.)
 */
export default function MeetingsError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Production messages from the server are replaced by a generic one; the digest
    // matches the full error in the server logs.
    console.error("An unexpected error occurred in the meetings routes:", error);
    // The control that had focus (e.g. a submit button) is gone; start keyboard and screen
    // reader users at this message.
    headingRef.current?.focus();
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <div role="alert" className="mx-auto w-full max-w-prose rounded-card border border-border bg-surface/60 p-6">
      <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
        Something went wrong
      </h1>
      <p className="mt-2 text-muted">
        We couldn&apos;t complete that request. This can happen when the meeting database is
        briefly unavailable. Please try again in a moment.
      </p>
      {digest && <p className="mt-2 text-xs text-muted">Reference: {digest}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          aria-disabled={isRetrying}
          onClick={() => {
            if (isRetrying) return;
            startTransition(() => {
              router.refresh();
              reset();
            });
          }}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          {isRetrying ? "Trying again…" : "Try again"}
        </button>
        <Link href="/meetings" className="rounded-md border border-border px-4 py-2 hover:bg-surface">
          Back to all meetings
        </Link>
      </div>
    </div>
  );
}
