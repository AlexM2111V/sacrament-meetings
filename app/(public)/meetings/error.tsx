"use client"; // Error boundaries must be Client Components

// Catches unexpected errors while loading meetings or running a meeting Server Action
// (e.g. delete). Shared with app/(admin)/meetings/error.tsx.
export { default } from "@/components/MeetingsError";
