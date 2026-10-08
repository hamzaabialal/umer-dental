import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { listAppts } from "@/lib/appointments";
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
  const appts = await listAppts({ from: days[0], to: days[6], branch });

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
                    {a.procedure && <div className="truncate opacity-80">{a.procedure}</div>}
                    {!branch && <div className="opacity-60">{a.branch}</div>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
