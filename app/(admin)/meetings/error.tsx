"use client"; // Error boundaries must be Client Components

// Catches unexpected errors in the create/edit pages, including database failures that
// createMeeting/updateMeeting re-throw. Shared with app/(public)/meetings/error.tsx.
export { default } from "@/components/MeetingsError";
