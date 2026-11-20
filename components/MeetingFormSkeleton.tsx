/** Placeholder shown while an admin meeting page loads its meeting. */
export default function MeetingFormSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-3xl animate-pulse space-y-4">
      <span className="sr-only">{label}</span>
      <div className="mx-auto h-8 w-56 rounded bg-surface" />
      <div className="mx-auto h-5 w-44 rounded bg-surface/60" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 rounded-card bg-surface/60" />
      ))}
    </div>
  );
}
