import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { bookedBy, listAppts } from "@/lib/appointments";
import { prettyDate, prettyTime, todayPK } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";

const STATUS_STYLE: Record<string, string> = {
  Booked: "border-l-navy bg-blue-50",
  Confirmed: "border-l-emerald-600 bg-emerald-50",
  Arrived: "border-l-amber-500 bg-amber-50",
  Completed: "border-l-slate-400 bg-slate-100 text-slate-500",
  Cancelled: "border-l-red-400 bg-red-50 line-through text-slate-400",
  "No-show": "border-l-red-600 bg-red-50 text-red-700",
};

const UPCOMING_DAYS = 90;

function addDays(ymd: string, n: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function mondayOf(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return addDays(ymd, -dow);
}

export default async function AppointmentsPage({ searchParams }: PageProps<"/appointments">) {
  const { branch } = await pageContext();
  const sp = await searchParams;
  const today = todayPK();
  const start = mondayOf(typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const [appts, upcomingAll] = await Promise.all([
    listAppts({ from: days[0], to: days[6], branch }),
    // Website bookings can be up to 90 days out, far beyond the week on screen.
    listAppts({ from: today, to: addDays(today, UPCOMING_DAYS), branch }),
  ]);
  const upcoming = upcomingAll.filter((a) => !["Completed", "Cancelled", "No-show"].includes(a.status));

  return (
    <>
      <PageHeader title="Appointments" sub={`Week of ${prettyDate(start)}`}>
        <Link href={`/appointments?week=${addDays(start, -7)}`} className="btn-ghost">
          ← Prev
        </Link>
        <Link href="/appointments" className="btn-ghost">
          This week
        </Link>
        <Link href={`/appointments?week=${addDays(start, 7)}`} className="btn-ghost">
          Next →
        </Link>
        <form className="flex items-center gap-1.5">
          <input type="date" name="week" defaultValue={start} className="input w-auto py-1.5" aria-label="Go to date" />
          <button className="btn-ghost">Go</button>
        </form>
        <Link href="/appointments/new" className="btn-gold">
          + Book Appointment
        </Link>
      </PageHeader>
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((d) => {
          const list = appts.filter((a) => a.date === d);
          const isToday = d === today;
          return (
            <div key={d} className={`min-h-40 rounded-xl bg-white p-2.5 ring-1 ${isToday ? "ring-2 ring-gold" : "ring-slate-200"}`}>
              <div className="mb-2 flex items-baseline justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    {new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                  </div>
                  <div className={`text-sm font-bold ${isToday ? "text-gold" : "text-navy"}`}>{prettyDate(d)}</div>
                </div>
                {d >= today && (
                  <Link href={`/appointments/new?date=${d}`} className="text-lg leading-none text-slate-400 hover:text-navy" title="Book on this day">
                    +
                  </Link>
                )}
              </div>
              <div className="space-y-1.5">
                {list.map((a) => (
                  <Link
                    key={a.id}
                    href={`/appointments/${a.id}`}
                    className={`block rounded-md border-l-4 px-2 py-1.5 text-xs hover:brightness-95 ${STATUS_STYLE[a.status] ?? ""}`}
                  >
                    <b>{prettyTime(a.time)}</b> {a.patient_name}
                    {a.source === "website" &&
                      (a.seen_at ? (
                        <span className="badge ml-1 bg-gold/20 text-navy">Website</span>
                      ) : (
                        <span className="badge ml-1 bg-red-600 text-white">New</span>
                      ))}
                    {a.procedure && <div className="truncate opacity-80">{a.procedure}</div>}
                    {!branch && <div className="opacity-60">{a.branch}</div>}
                    <div className="truncate opacity-60">by {bookedBy(a)}</div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6 overflow-x-auto p-0">
        <h2 className="px-5 pt-4 pb-2 font-semibold text-navy">
          Upcoming appointments <span className="font-normal text-slate-500">({upcoming.length}, next {UPCOMING_DAYS} days)</span>
        </h2>
        {upcoming.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">No upcoming appointments.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Treatment</th>
                {!branch && <th>Branch</th>}
                <th>Status</th>
                <th>Booked by</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap">
                    <Link href={`/appointments/${a.id}`} className="font-medium text-navy hover:underline">
                      {prettyDate(a.date)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap">{prettyTime(a.time)}</td>
                  <td>
                    <Link href={`/appointments/${a.id}`} className="hover:underline">
                      {a.patient_name}
                    </Link>
                    {a.source === "website" && !a.seen_at && <span className="badge ml-1.5 bg-red-600 text-white">New</span>}
                  </td>
                  <td>{a.procedure || "—"}</td>
                  {!branch && <td>{a.branch}</td>}
                  <td>{a.status}</td>
                  <td className="whitespace-nowrap">{bookedBy(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
