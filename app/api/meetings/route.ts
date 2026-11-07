import type { NextRequest } from "next/server";
import { getMeetings, isIsoDate } from "@/lib/meetings-db";

// GET /api/meetings              → all meetings, newest first
// GET /api/meetings?date=2026-11-08 → meetings on that date ([] if none)
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date"); // string or null

  if (date !== null && !isIsoDate(date)) {
    return Response.json(
      { error: `Invalid date: ${date}. Use the format YYYY-MM-DD.` },
      { status: 400 },
    );
  }

  const meetings = await getMeetings(date);
  return Response.json(meetings);
}
