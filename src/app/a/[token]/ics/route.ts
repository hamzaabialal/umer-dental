import { getAppt } from "@/lib/appointments";
import { buildIcs } from "@/lib/calendar";

export async function GET(_req: Request, ctx: RouteContext<"/a/[token]/ics">) {
  const a = await getAppt({ token: (await ctx.params).token });
  if (!a) return new Response("Not found", { status: 404 });
  return new Response(buildIcs([a]), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="umar-dental-appointment-${a.date}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
