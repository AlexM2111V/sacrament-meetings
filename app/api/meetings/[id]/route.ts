import type { NextRequest } from "next/server";
import { getMeetingById, parseMeetingId } from "@/lib/meetings-db";

// GET /api/meetings/[id] — full meeting agenda.
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/meetings/[id]">) {
  const { id: rawId } = await ctx.params;
  const id = parseMeetingId(rawId);

  if (id === null) {
    return Response.json({ error: `Invalid meeting id: ${rawId}. The id must be a whole number.` }, { status: 400 });
  }

  const meeting = await getMeetingById(id);
  if (!meeting) {
    return Response.json({ error: `Meeting ${id} not found` }, { status: 404 });
  }

  return Response.json(meeting);
}
