import Image from "next/image";
import Link from "next/link";
import { WARD_NAME } from "@/lib/meetings-db";

export default function Home() {
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <Image
        src="/chapel-hero.svg"
        alt="Illustration of a white chapel with a steeple on green hills at sunrise"
        width={1200}
        height={480}
        loading="eager"
        fetchPriority="high"
        className="h-auto w-full rounded-card border border-border"
      />
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{WARD_NAME}</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-muted">
          Sacrament meeting programs: speakers, hymns and the agenda for each Sunday.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/meetings/current"
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
        >
          This Sunday&apos;s Program
        </Link>
        <Link
          href="/meetings"
          className="rounded-full border border-border px-6 py-3 font-medium hover:bg-surface"
        >
          All Meetings
        </Link>
      </div>
    </section>
  );
}
