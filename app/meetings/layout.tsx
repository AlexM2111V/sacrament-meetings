import { Suspense } from "react";
import { connection } from "next/server";
import NavLinks, { NavLinksFallback } from "@/components/NavLinks";
import { getCurrentMeeting } from "@/lib/meetings-db";

async function SectionNav() {
  // Which meeting is "this Sunday" depends on today's date, so resolve it per request.
  await connection();
  const current = await getCurrentMeeting();
  return <NavLinks variant="section" label="Meetings" currentMeetingId={current?.id} />;
}

export default function MeetingsLayout({ children }: LayoutProps<"/meetings">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
          Sacrament Meetings
        </p>
        <Suspense fallback={<NavLinksFallback variant="section" label="Meetings" />}>
          <SectionNav />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
