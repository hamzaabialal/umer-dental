import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Pager } from "@/components/ListControls";
import { sql } from "@/lib/db";
import { prettyDate, todayPK, waLink } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";

const PAGE = 50;

/** Patients whose most recent visit was 6+ months ago and who have no upcoming appointment. */
export default async function RecallsPage({ searchParams }: PageProps<"/recalls">) {
  const { branch } = await pageContext();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const today = todayPK();
  const [y, m, d] = today.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 7, d)).toISOString().slice(0, 10);

  const rows = await sql`
    with last as (
      select distinct on (v.mr) v.mr, v.date, v.procedure
      from opd_visits v order by v.mr, v.date desc, v.id desc
    )
    select l.mr, l.date, l.procedure, p.name, p.phone, p.branch, count(*) over () as total
    from last l join patients p on p.mr = l.mr
    where l.date <= ${cutoff}
      and (${branch}::text is null or p.branch = ${branch})
      and not exists (select 1 from appointments a where a.mr = l.mr and a.date >= ${today} and a.status not in ('Cancelled','No-show'))
    order by l.date desc
    limit ${PAGE} offset ${(page - 1) * PAGE}`;
  const total = Number(rows[0]?.total ?? 0);

  return (
    <>
      <PageHeader title="6-Month Recalls" sub={`${total} patients due (last visit on or before ${prettyDate(cutoff)}, nothing booked)`} />
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Last visit</th>
              <th>Patient</th>
              <th>Recall type</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const scaling = /scal|polish|prophy/i.test(r.procedure);
              const wa = waLink(
                r.phone,
                `Dear ${r.name}, this is a friendly reminder from Umar Dental & Implant Center that your ${scaling ? "6-month scaling / cleaning" : "6-month dental check-up"} is due. Reply here or call us to book your appointment. Thank you.`,
              );
              return (
                <tr key={r.mr}>
                  <td className="whitespace-nowrap">{prettyDate(r.date)}</td>
                  <td>
                    <Link href={`/patients/${encodeURIComponent(r.mr)}`} className="font-medium text-navy hover:underline">
                      {r.name}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {r.mr} • {r.procedure}
                    </div>
                  </td>
                  <td>
                    <span className="badge">{scaling ? "Scaling recall" : "Check-up recall"}</span>
                  </td>
                  <td>{r.phone || <span className="text-slate-400">No phone</span>}</td>
                  <td className="space-x-1.5 whitespace-nowrap">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener" className="btn-wa px-2.5 py-1 text-xs">
                        WhatsApp
                      </a>
                    )}
                    <Link href={`/appointments/new?mr=${encodeURIComponent(r.mr)}`} className="btn-ghost px-2.5 py-1 text-xs">
                      Book
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={total} pageSize={PAGE} />
    </>
  );
}
