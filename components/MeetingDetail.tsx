import type { Hymn, SacramentMeeting } from "@/lib/types";
import { formatMeetingDate, MEETING_TYPE_LABELS, WARD_NAME } from "@/lib/meetings-db";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-border py-1.5">
      <dt className="font-medium">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function HymnText({ hymn }: { hymn: Hymn }) {
  return (
    <>
      #{hymn.number} — <em>{hymn.title}</em>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid print:mt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs text-muted">{children}</span>;
}

export default function MeetingDetail({
  meeting,
  printMode = false,
}: {
  meeting: SacramentMeeting;
  printMode?: boolean;
}) {
  const announcements = meeting.announcements ?? [];
  // Stake conferences list stake business items; sacrament meetings list ward business,
  // with stake business (when set) as one of its bullet points.
  const isStakeConference = meeting.meetingType === "stake";
  const businessTitle = isStakeConference ? "Stake Business" : "Ward Business";
  const businessItems = isStakeConference
    ? (meeting.stakeBusinessItems ?? []).map((b) => b.description)
    : [
        ...meeting.wardBusiness.map((b) => b.description),
        ...(meeting.stakeBusiness ? ["Stake business"] : []),
      ];
  const isTestimony = meeting.meetingType === "testimony";

  return (
    <article
      className={`mx-auto w-full ${printMode ? "max-w-xl font-serif" : "max-w-prose"} print:max-w-none print:font-serif`}
    >
      <header className="text-center">
        {/* Site header is hidden when printing, so the ward name lives here too. */}
        <p className={`text-lg font-semibold ${printMode ? "" : "hidden"} print:block`}>
          {WARD_NAME}
        </p>
        <p className="text-sm uppercase tracking-widest text-muted">
          {MEETING_TYPE_LABELS[meeting.meetingType]}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{formatMeetingDate(meeting.date)}</h1>
      </header>

      <Section title="Leadership">
        <dl>
          <Row label="Presiding">{meeting.presiding}</Row>
          <Row label="Conducting">{meeting.conducting}</Row>
        </dl>
      </Section>

      {announcements.length > 0 && (
        <Section title="Announcements">
          <div className="border-b border-dotted border-border pb-3">
            <ul className="ml-5 list-disc text-sm">
              {announcements.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        </Section>
      )}

      <Section title="Program">
        <dl>
          <Row label="Opening Hymn"><HymnText hymn={meeting.openingHymn} /></Row>
          <Row label="Opening Prayer">{meeting.openingPrayer}</Row>
        </dl>

        {businessItems.length > 0 && (
          <div className="mt-3 border-b border-dotted border-border pb-3">
            <p className="font-medium">{businessTitle}</p>
            <ul className="ml-5 list-disc text-sm">
              {businessItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        <dl className="mt-3">
          <Row label="Sacrament Hymn"><HymnText hymn={meeting.sacramentHymn} /></Row>
        </dl>
        {/* A program step with no assignee, so it is not a term/value pair. */}
        <p className="border-b border-dotted border-border py-1.5 text-center font-semibold">
          Administration of the Sacrament
        </p>

        {isTestimony && (
          <p className="mt-3 border-b border-dotted border-border py-1.5 text-center font-semibold">
            Bearing of Testimonies
          </p>
        )}

        {meeting.speakers.length > 0 ? (
          <dl className="mt-3">
            {meeting.speakers.map((s, i) =>
              s.type === "musical-number" ? (
                <Row key={i} label="Musical Number">
                  <em>{s.topic}</em>
                  <Subtitle>{s.name}</Subtitle>
                </Row>
              ) : (
                <Row key={i} label="Speaker">
                  {s.name}
                  <Subtitle>{s.topic}</Subtitle>
                </Row>
              ),
            )}
          </dl>
        ) : (
          !isTestimony && <p className="mt-3 text-center italic text-muted">No speakers assigned</p>
        )}

        <dl className="mt-3">
          <Row label="Closing Hymn"><HymnText hymn={meeting.closingHymn} /></Row>
          <Row label="Closing Prayer">{meeting.closingPrayer}</Row>
        </dl>
      </Section>
    </article>
  );
}
