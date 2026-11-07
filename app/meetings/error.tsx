"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function MeetingsError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="rounded-card border border-border bg-surface/60 p-6">
      <h1 className="text-xl font-semibold">We couldn&apos;t load the meetings</h1>
      <p className="mt-2 text-muted">
        Something went wrong while loading meeting data. Please try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
