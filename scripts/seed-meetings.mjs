// Adds 12 sample meetings (4 past, 8 upcoming as of Nov 19, 2026). Together with the
// meetings already in the database, that gave 10 upcoming and 10 past: two pages per tab.
//
//   node --env-file=.env.local scripts/seed-meetings.mjs
//
// Safe to re-run: a date that already has a meeting is skipped (meetings.date is unique),
// so meetings you created or edited in the app are never overwritten.
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/seed-meetings.mjs");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const BISHOP = "Bishop Daniel Reyes";
const hymn = (number, title) => ({ number, title });
const speaker = (name, topic) => ({ name, topic, type: "speaker" });
const music = (name, topic) => ({ name, topic, type: "musical-number" });
const business = (...items) => items.map((description) => ({ description }));

/** Defaults for a regular sacrament meeting; each entry overrides what differs. */
const meeting = (m) => ({
  meetingType: "regular",
  presiding: BISHOP,
  announcements: [],
  wardBusiness: [],
  stakeBusiness: false,
  stakeBusinessItems: [],
  speakers: [],
  ...m,
});

const MEETINGS = [
  // ---- Past ----
  meeting({
    date: "2026-09-13",
    conducting: "Brother Marcus Bell",
    openingHymn: hymn(30, "Come, Come, Ye Saints"),
    openingPrayer: "Sister Ana Quispe",
    sacramentHymn: hymn(171, "With Humble Heart"),
    speakers: [
      speaker("Sister Carmen Flores", "Ministering as the Savior Did"),
      speaker("Brother Luis Paredes", "Covenant Belonging"),
    ],
    closingHymn: hymn(223, "Have I Done Any Good?"),
    closingPrayer: "Brother Jorge Salazar",
  }),
  meeting({
    date: "2026-09-20",
    conducting: "Brother Samuel Ortiz",
    announcements: ["Ward temple trip Saturday, Sep 26 at 7:00 AM"],
    openingHymn: hymn(58, "Come, Ye Children of the Lord"),
    openingPrayer: "Brother Kevin Adams",
    sacramentHymn: hymn(183, "In Remembrance of Thy Suffering"),
    wardBusiness: business("Sustain: Sister Lucia Vargas as Primary pianist"),
    speakers: [
      speaker("Sister Rosa Mamani", "The Blessings of the Temple"),
      music("Youth choir", "Teach Me to Walk in the Light"),
      speaker("Brother Hector Rojas", "Preparing to Make Sacred Covenants"),
    ],
    closingHymn: hymn(304, "Teach Me to Walk in the Light"),
    closingPrayer: "Sister Elena Castro",
  }),
  meeting({
    date: "2026-09-27",
    conducting: "Brother Andrew Price",
    announcements: ["General Conference broadcast next Sunday at the meetinghouse"],
    openingHymn: hymn(19, "We Thank Thee, O God, for a Prophet"),
    openingPrayer: "Sister Maria Huaman",
    sacramentHymn: hymn(175, "O God, the Eternal Father"),
    speakers: [
      speaker("Brother Diego Chavez", "Following Living Prophets"),
      speaker("Sister Paula Torres", "Preparing for General Conference"),
    ],
    closingHymn: hymn(66, "Rejoice, the Lord Is King!"),
    closingPrayer: "Brother Raul Medina",
  }),
  meeting({
    date: "2026-10-18",
    conducting: "Brother Andrew Price",
    openingHymn: hymn(85, "How Firm a Foundation"),
    openingPrayer: "Sister Rachel Kim",
    sacramentHymn: hymn(196, "Jesus, Once of Humble Birth"),
    speakers: [
      speaker("Ethan Morales", "Lessons from General Conference"),
      speaker("Sister Rachel Kim", "Hearing Him"),
      speaker("Brother James Walker", "Faith in Every Footstep"),
    ],
    closingHymn: hymn(134, "I Believe in Christ"),
    closingPrayer: "Brother Tomas Gutierrez",
  }),

  // ---- Upcoming ----
  meeting({
    date: "2026-11-29",
    conducting: "Brother Samuel Ortiz",
    announcements: ["Christmas devotional choir practice today after church"],
    openingHymn: hymn(72, "Praise to the Lord, the Almighty"),
    openingPrayer: "Sister Gabriela Ramos",
    sacramentHymn: hymn(187, "God Loved Us, So He Sent His Son"),
    speakers: [
      speaker("Brother Felipe Torres", "Light the World"),
      speaker("Sister Isabel Navarro", "Serving Like the Savior"),
    ],
    closingHymn: hymn(219, "Because I Have Been Given Much"),
    closingPrayer: "Brother Manuel Ccori",
  }),
  meeting({
    date: "2026-12-06",
    meetingType: "testimony",
    conducting: BISHOP,
    announcements: ["Tithing declaration appointments are open through Dec 27"],
    openingHymn: hymn(136, "I Know That My Redeemer Lives"),
    openingPrayer: "Brother Kevin Adams",
    sacramentHymn: hymn(181, "Jesus of Nazareth, Savior and King"),
    wardBusiness: business("Release: Sister Lucia Vargas as Primary pianist"),
    closingHymn: hymn(152, "God Be with You Till We Meet Again"),
    closingPrayer: "Sister Carmen Flores",
  }),
  meeting({
    date: "2026-12-13",
    conducting: "Brother Marcus Bell",
    announcements: ["Ward Christmas party Saturday, Dec 19 at 6:00 PM"],
    openingHymn: hymn(201, "Joy to the World"),
    openingPrayer: "Sister Ana Quispe",
    sacramentHymn: hymn(193, "I Stand All Amazed"),
    speakers: [
      speaker("Sister Beatriz Ramos", "The Prophecies of His Birth"),
      music("Ward Choir", "Far, Far Away on Judea's Plains"),
      speaker("Brother Luis Paredes", "Christ, the Gift of the Father"),
    ],
    closingHymn: hymn(209, "Hark! The Herald Angels Sing"),
    closingPrayer: "Brother Diego Chavez",
  }),
  meeting({
    date: "2026-12-27",
    conducting: "Brother Andrew Price",
    openingHymn: hymn(215, "Ring Out, Wild Bells"),
    openingPrayer: "Sister Paula Torres",
    sacramentHymn: hymn(169, "As Now We Take the Sacrament"),
    speakers: [
      speaker("Brother Hector Rojas", "Goals with a Gospel Focus"),
      speaker("Sister Elena Castro", "Becoming New Creatures in Christ"),
    ],
    closingHymn: hymn(243, "Let Us All Press On"),
    closingPrayer: "Brother Jorge Salazar",
  }),
  meeting({
    date: "2027-01-03",
    meetingType: "testimony",
    conducting: BISHOP,
    openingHymn: hymn(3, "Now Let Us Rejoice"),
    openingPrayer: "Sister Rosa Mamani",
    sacramentHymn: hymn(185, "Reverently and Meekly Now"),
    closingHymn: hymn(98, "I Need Thee Every Hour"),
    closingPrayer: "Brother Raul Medina",
  }),
  meeting({
    date: "2027-01-10",
    conducting: "Brother Samuel Ortiz",
    announcements: ["New Come, Follow Me manuals available in the library"],
    openingHymn: hymn(116, "Come, Follow Me"),
    openingPrayer: "Brother Tomas Gutierrez",
    sacramentHymn: hymn(195, "How Great the Wisdom and the Love"),
    wardBusiness: business("Sustain: Brother Manuel Ccori as Sunday School president"),
    speakers: [
      speaker("Sister Maria Huaman", "Studying the Scriptures as a Family"),
      speaker("Brother Felipe Torres", "Come, Follow Me"),
    ],
    closingHymn: hymn(131, "More Holiness Give Me"),
    closingPrayer: "Sister Gabriela Ramos",
  }),
  meeting({
    date: "2027-01-17",
    conducting: "Brother Marcus Bell",
    openingHymn: hymn(6, "Redeemer of Israel"),
    openingPrayer: "Sister Isabel Navarro",
    sacramentHymn: hymn(194, "There Is a Green Hill Far Away"),
    speakers: [
      speaker("Brother Kevin Adams", "Prayer"),
      music("Vera family", "Did You Think to Pray?"),
      speaker("Sister Carmen Flores", "Personal Revelation"),
    ],
    closingHymn: hymn(142, "Sweet Hour of Prayer"),
    closingPrayer: "Brother Luis Paredes",
  }),
  meeting({
    date: "2027-01-24",
    conducting: "Brother Andrew Price",
    openingHymn: hymn(86, "How Great Thou Art"),
    openingPrayer: "Brother Diego Chavez",
    sacramentHymn: hymn(172, "In Humility, Our Savior"),
    speakers: [
      speaker("Sister Ana Quispe", "Faith in Jesus Christ"),
      speaker("Brother Jorge Salazar", "Enduring to the End"),
    ],
    closingHymn: hymn(85, "How Firm a Foundation"),
    closingPrayer: "Sister Beatriz Ramos",
  }),
];

let added = 0;
for (const m of MEETINGS) {
  const rows = await sql`
    INSERT INTO meetings (
      date, meeting_type, presiding, conducting, announcements, opening_hymn, opening_prayer,
      ward_business, stake_business, stake_business_items, sacrament_hymn, speakers,
      closing_hymn, closing_prayer
    ) VALUES (
      ${m.date}::date, ${m.meetingType}, ${m.presiding}, ${m.conducting}, ${m.announcements}::text[],
      ${JSON.stringify(m.openingHymn)}::jsonb, ${m.openingPrayer},
      ${JSON.stringify(m.wardBusiness)}::jsonb, ${m.stakeBusiness},
      ${JSON.stringify(m.stakeBusinessItems)}::jsonb, ${JSON.stringify(m.sacramentHymn)}::jsonb,
      ${JSON.stringify(m.speakers)}::jsonb, ${JSON.stringify(m.closingHymn)}::jsonb, ${m.closingPrayer}
    )
    ON CONFLICT (date) DO NOTHING
    RETURNING id
  `;
  if (rows.length) added++;
  console.log(`${m.date}  ${rows.length ? `added (id ${rows[0].id})` : "skipped, date already taken"}`);
}
console.log(`\n${added} added, ${MEETINGS.length - added} skipped.`);
