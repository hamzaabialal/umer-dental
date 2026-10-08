import { sql } from "@/lib/db";
import { listAppts } from "@/lib/appointments";
import { buildIcs } from "@/lib/calendar";

/**
 * Personal subscription feed for staff ("Add calendar from URL" in Google / Apple / Outlook).
 * Authenticated by the user's secret calendar_token; receptionists only get their own branch.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/calendar/[token]">) {
  const token = (await ctx.params).token.replace(/\.ics$/, "");
  const [user] = await sql`select branch from users where calendar_token = ${token} and active`;
  if (!user) return new Response("Not found", { status: 404 });

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const now = Date.now();
  const appts = await listAppts({
    from: fmt(new Date(now - 60 * 86400000)),
    to: fmt(new Date(now + 365 * 86400000)),
    branch: (user.branch as string | null) ?? null,
  });
  return new Response(buildIcs(appts, { forStaff: true, name: "Umar Dental – Appointments" }), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
  });
}
