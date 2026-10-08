import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { sql } from "@/lib/db";
import { listAppts } from "@/lib/appointments";
import { pkr, prettyDate, prettyTime, rs, todayPK } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { user, branch } = await pageContext();
  const sp = await searchParams;
  const today = todayPK();
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.slice(0, 7);
  const m = month + "%";

  const [[k], daily, todays, pending] = await Promise.all([
    sql`
      select
        (select count(*)::int from opd_visits where date like ${m} and (${branch}::text is null or branch = ${branch})) as visits,
        (select count(distinct mr)::int from opd_visits where date like ${m} and (${branch}::text is null or branch = ${branch})) as unique_patients,
        (select count(*)::int from patients where first_visit like ${m} and (${branch}::text is null or branch = ${branch})) as new_patients,
        (select count(*)::int from appointments where date like ${m} and (${branch}::text is null or branch = ${branch})) as appointments,
        (select coalesce(sum(net),0)::int from invoices where date like ${m} and (${branch}::text is null or branch = ${branch})) as billed,
        (select coalesce(sum(paid_cash + paid_card),0)::int from invoices where date like ${m} and (${branch}::text is null or branch = ${branch})) as received,
        (select coalesce(sum(greatest(net - paid_cash - paid_card, 0)),0)::int from invoices where (${branch}::text is null or branch = ${branch})) as outstanding,
        (select coalesce(sum(amount),0)::int from expenses where date like ${m} and (${branch}::text is null or branch = ${branch})) as expenses,
        (select coalesce(sum(amount),0)::int from expenses where date like ${m} and (category || ' ' || description) ilike '%lab%' and (${branch}::text is null or branch = ${branch})) as lab`,
    sql`select substr(date, 9, 2)::int as day, count(*)::int as n from opd_visits
        where date like ${m} and (${branch}::text is null or branch = ${branch}) group by 1`,
    listAppts({ from: today, to: today, branch }),
    sql`select i.id, i.invoice_no, p.name, i.net - i.paid_cash - i.paid_card as due
        from invoices i join patients p on p.mr = i.mr
        where i.net > i.paid_cash + i.paid_card and (${branch}::text is null or i.branch = ${branch})
        order by due desc limit 8`,
  ]);

  const [y, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const counts = Array.from({ length: daysInMonth }, (_, i) => Number(daily.find((d) => d.day === i + 1)?.n ?? 0));
  const max = Math.max(1, ...counts);

  const kpis: [string, string | number, string?][] = [
    ["OPD visits", k.visits],
    ["Unique patients", k.unique_patients],
    ["New patients", k.new_patients],
    ["Appointments", k.appointments],
    ["Billed", pkr(k.billed)],
    ["Received", pkr(k.received)],
    ["Outstanding (all time)", pkr(k.outstanding), "text-red-700"],
    ["Expenses", pkr(k.expenses)],
    ["Lab expenses", pkr(k.lab)],
    ["Net income", pkr(k.received - k.expenses), k.received - k.expenses < 0 ? "text-red-700" : "text-emerald-700"],
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${user.full_name}`} sub={prettyDate(today)}>
        <form className="flex gap-2">
          <input type="month" name="month" defaultValue={month} className="input w-auto" />
          <button className="btn-ghost">Show</button>
        </form>
        <Link href="/appointments/new" className="btn-gold">+ Appointment</Link>
        <Link href="/invoices/new" className="btn-primary">+ Invoice</Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map(([label, v, cls]) => (
          <div key={label} className="card">
            <div className="text-xs text-slate-500">{label}</div>
            <div className={`mt-1 text-xl font-bold ${cls ?? "text-navy"}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <h2 className="mb-3 font-semibold text-navy">Daily OPD — {month}</h2>
          <div className="flex h-44 items-end gap-1">
            {counts.map((c, i) => (
              <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={`${i + 1}: ${c} visits`}>
                <div className="rounded-t bg-gradient-to-t from-[#b78b18] to-gold" style={{ height: `${(c / max) * 100}%`, minHeight: c ? 3 : 0 }} />
                <div className="mt-1 h-3 text-center text-[9px] text-slate-400">{(i + 1) % 5 === 0 || i === 0 ? i + 1 : ""}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-navy">Today&apos;s appointments ({todays.length})</h2>
            <Link href="/appointments" className="text-xs text-slate-500 hover:text-navy">Calendar →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {todays.map((a) => (
              <Link key={a.id} href={`/appointments/${a.id}`} className="flex justify-between px-5 py-2.5 text-sm hover:bg-slate-50">
                <span>
                  <b className="text-navy">{prettyTime(a.time)}</b> {a.patient_name}
                  <span className="text-slate-400"> • {a.procedure || a.branch}</span>
                </span>
                <span className="badge">{a.status}</span>
              </Link>
            ))}
            {!todays.length && <p className="px-5 py-4 text-sm text-slate-400">No appointments today.</p>}
          </div>
        </div>
      </div>

      <div className="card mt-5 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-navy">Largest pending balances</h2>
          <Link href="/invoices?due=1" className="text-xs text-slate-500 hover:text-navy">All pending →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {pending.map((p) => (
            <Link key={p.id} href={`/invoices/${p.id}`} className="flex justify-between px-5 py-2.5 text-sm hover:bg-slate-50">
              <span>
                {p.name} <span className="text-slate-400">• {p.invoice_no}</span>
              </span>
              <b className="text-red-700">Rs. {rs(p.due)}</b>
            </Link>
          ))}
          {!pending.length && <p className="px-5 py-4 text-sm text-slate-400">No pending balances.</p>}
        </div>
      </div>
    </>
  );
}
