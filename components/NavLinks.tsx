"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Variant = "main" | "section";

/**
 * "page": the link points to the page being viewed.
 * "true": the link is the active section, but the page is something inside it.
 */
type CurrentState = "page" | "true" | undefined;

interface NavContext {
  pathname: string;
  /** Id of the most recent Sunday's meeting, so "This Sunday" can be active on its detail page. */
  currentMeetingId?: number;
}

interface NavItem {
  href: string;
  label: string;
  current: (ctx: NavContext) => CurrentState;
}

const isMeetingDetail = (p: string) => /^\/meetings\/\d+$/.test(p);
const isThisSunday = ({ pathname, currentMeetingId }: NavContext) =>
  pathname === "/meetings/current" ||
  (currentMeetingId !== undefined && pathname === `/meetings/${currentMeetingId}`);

// Kept in this client module because functions can't be passed as props from Server Components.
const NAV_ITEMS: Record<Variant, NavItem[]> = {
  main: [
    { href: "/", label: "Home", current: ({ pathname }) => (pathname === "/" ? "page" : undefined) },
    {
      href: "/meetings",
      label: "Meetings",
      current: ({ pathname }) =>
        pathname === "/meetings" ? "page" : pathname.startsWith("/meetings/") ? "true" : undefined,
    },
  ],
  section: [
    {
      href: "/meetings",
      label: "All Meetings",
      current: (ctx) => {
        if (ctx.pathname === "/meetings") return "page";
        // A meeting page belongs under "All Meetings" unless it is this Sunday's meeting.
        return isMeetingDetail(ctx.pathname) && !isThisSunday(ctx) ? "true" : undefined;
      },
    },
    {
      href: "/meetings/current",
      label: "This Sunday",
      // /meetings/current redirects to this meeting's page, so that page is what the link opens.
      current: (ctx) => (isThisSunday(ctx) ? "page" : undefined),
    },
  ],
};

const STYLES: Record<Variant, { list: string; link: string; active: string; idle: string }> = {
  main: {
    list: "flex gap-1 text-sm",
    link: "rounded-md px-3 py-1.5 transition-colors",
    active: "bg-primary text-primary-foreground",
    idle: "hover:bg-surface",
  },
  section: {
    list: "flex gap-6 border-b border-border text-sm",
    link: "-mb-px inline-block border-b-2 pb-2 transition-colors",
    active: "border-accent font-medium text-foreground",
    idle: "border-transparent text-muted hover:text-foreground",
  },
};

export default function NavLinks({
  variant = "main",
  label = "Main",
  currentMeetingId,
}: {
  variant?: Variant;
  label?: string;
  currentMeetingId?: number;
}) {
  const pathname = usePathname();
  const s = STYLES[variant];

  return (
    <nav aria-label={label}>
      <ul className={s.list}>
        {NAV_ITEMS[variant].map((item) => {
          const current = item.current({ pathname, currentMeetingId });
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current}
                className={`${s.link} ${current ? s.active : s.idle}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Static fallback rendered while the pathname is unknown during prerendering. */
export function NavLinksFallback({
  variant = "main",
  label = "Main",
}: {
  variant?: Variant;
  label?: string;
}) {
  const s = STYLES[variant];
  // Fully usable navigation (keyboard + screen readers); it only lacks the active-link highlight.
  return (
    <nav aria-label={label}>
      <ul className={s.list}>
        {NAV_ITEMS[variant].map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={`${s.link} ${s.idle}`}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
