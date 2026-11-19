"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const linkClassName =
  "rounded-card border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:bg-surface focus-visible:border-accent";

/**
 * `currentPage` comes from the server, already validated and clamped to 1…totalPages,
 * so these controls always agree with the meetings being shown.
 */
export function Pagination({ totalPages, currentPage }: { totalPages: number; currentPage: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // A single page needs no controls.
  if (totalPages <= 1) return null;

  function createPageURL(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {currentPage > 1 ? (
        <Link href={createPageURL(currentPage - 1)} className={linkClassName}>
          <span aria-hidden="true">←</span> Previous
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <span className="text-sm text-muted">
        Page <span className="font-semibold text-foreground">{currentPage}</span> of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={createPageURL(currentPage + 1)} className={linkClassName}>
          Next <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
