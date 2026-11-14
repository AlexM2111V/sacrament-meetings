import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { formatMeetingDate, todayIsoDate, WARD_NAME } from "@/lib/meetings-db";
import NavLinks, { NavLinksFallback } from "./NavLinks";

async function CurrentDate() {
  // The date must be computed per request, not frozen at build time.
  await connection();
  // One value, in the ward's time zone, drives both the visible text and the machine-readable date.
  const today = todayIsoDate();
  return <time dateTime={today}>{formatMeetingDate(today)}</time>;
}

export default function Header() {
  return (
    <header className="border-b border-border print:hidden">
      <div className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-4 px-gutter py-4">
        <div>
          <Link href="/" className="font-serif text-xl font-semibold text-primary">
            {WARD_NAME}
          </Link>
          <p className="text-sm text-muted">
            <Suspense fallback={<span>&nbsp;</span>}>
              <CurrentDate />
            </Suspense>
          </p>
        </div>
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}
