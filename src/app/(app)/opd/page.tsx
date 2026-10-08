import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Pager, SearchBox } from "@/components/ListControls";
import { sql } from "@/lib/db";
import { prettyDate } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";

const PAGE = 50;

export default async function OpdPage({ searchParams }: PageProps<"/opd">) {
  const { branch } = await pageContext();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const like = `%${q}%`;
  const rows = await sql`
    select v.id, v.date, v.mr, p.name, v.branch, v.visit_type, v.procedure, count(*) over () as total
    from opd_visits v join patients p on p.mr = v.mr
    where (${branch}::text is null or v.branch = ${branch})
      and (${q} = '' or p.name ilike ${like} or v.mr ilike ${like} or v.procedure ilike ${like} or v.date like ${like})
    order by v.date desc, v.id desc
    limit ${PAGE} offset ${(page - 1) * PAGE}`;
  const total = Number(rows[0]?.total ?? 0);
  return (
    <>
      <PageHeader title="OPD Visits" sub={`${total.toLocaleString()} visits`}>
        <Link href="/opd/new" className="btn-gold">
          + Add OPD Visit
        </Link>
      </PageHeader>
      {sp.saved === "1" && (
        <div className="mb-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">Visit saved.</div>
      )}
      <div className="mb-3">
        <SearchBox placeholder="Search patient, MR, procedure or date (2026-09)" />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Branch</th>
              <th>Type</th>
              <th>Procedure</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td className="whitespace-nowrap">{prettyDate(v.date)}</td>
                <td>
                  <Link href={`/patients/${encodeURIComponent(v.mr)}`} className="font-medium text-navy hover:underline">
                    {v.name}
                  </Link>
                  <div className="text-xs text-slate-400">{v.mr}</div>
                </td>
                <td>{v.branch}</td>
                <td>
                  <span className="badge">{v.visit_type}</span>
                </td>
                <td className="text-slate-600">{v.procedure}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-slate-500">No visits found.</p>}
      </div>
      <Pager page={page} total={total} pageSize={PAGE} />
    </>
  );
}
