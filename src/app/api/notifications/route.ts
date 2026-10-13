import { listNewBookings } from "@/lib/appointments";
import { getUser } from "@/lib/session";

/** Polled by the notification bell: website bookings not yet opened. Receptionists only see their branch. */
export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await listNewBookings(user.branch), { headers: { "Cache-Control": "no-store" } });
}
