export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-4">
      <span className="sr-only">Loading meetings…</span>
      <div className="h-7 w-48 rounded bg-surface" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-card bg-surface/60" />
      ))}
    </div>
  );
}
