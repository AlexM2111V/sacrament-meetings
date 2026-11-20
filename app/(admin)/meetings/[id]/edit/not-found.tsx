import Link from "next/link";

export default function MeetingNotFound() {
  return (
    <div className="mx-auto w-full max-w-prose rounded-card border border-border bg-surface/60 p-6 text-center">
      <h1 className="text-xl font-semibold">Meeting not found</h1>
      <p className="mt-2 text-muted">
        We couldn&apos;t find a meeting with that ID. It may have been deleted, or the link may
        be mistyped.
      </p>
      <Link
        href="/meetings"
        className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Back to all meetings
      </Link>
    </div>
  );
}
