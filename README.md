This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Week 04 submission notes

The app uses route groups, so the files the assignment names as `app/meetings/...` live under
`app/(public)/` or `app/(admin)/`. The URLs are the same.

| Assignment path | File in this project |
| --- | --- |
| `lib/actions.ts` | `lib/actions.ts` (`createMeeting`, `updateMeeting`, `deleteMeeting`, `MeetingFormSchema`) |
| Create form | `app/(admin)/meetings/new/create-meeting-form.tsx` (route `/meetings/new`) |
| `app/meetings/[id]/edit/page.tsx` | `app/(admin)/meetings/[id]/edit/page.tsx` + `edit-meeting-form.tsx` |
| `app/meetings/[id]/edit/not-found.tsx` | `app/(admin)/meetings/[id]/edit/not-found.tsx` |
| `app/meetings/error.tsx` | `app/(public)/meetings/error.tsx` and `app/(admin)/meetings/error.tsx` (one boundary per route group; both use `components/MeetingsError.tsx`) |
| Delete button | `components/DeleteMeetingButton.tsx`, on each card in `components/MeetingCard.tsx` |

Notes on Next.js 16 behavior:

- **`reset()` vs `retry()`:** Next.js 16 passes error boundaries both. `reset()` re-renders without
  re-fetching, so "Try again" calls `router.refresh()` and `reset()` in one transition.
- **404 status:** pages stream before they decide. `proxy.ts` checks `/meetings/[id]` first so a
  missing meeting gets a real 404. The edit and delete pages call `notFound()` and render their
  own `not-found.tsx`, as the assignment requires. Those responses have status 200 with a
  `noindex` tag, because a status set in the proxy is overridden by the page render.
- **Deleting without JavaScript:** the Delete button is a link to `/meetings/[id]/delete`, a
  confirmation page, until JavaScript loads. After that it uses a confirm dialog.

Environment: `DATABASE_URL` (Neon) and `APP_URL` (this app's own URL; meeting pages read
through `/api/meetings`) are required in every deployed environment. See `.env.example`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
