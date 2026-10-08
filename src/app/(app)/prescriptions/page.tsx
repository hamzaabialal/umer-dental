import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Pager, SearchBox } from "@/components/ListControls";
import { sql } from "@/lib/db";
import { prettyDate } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";

const PAGE = 50;

export default async function PrescriptionsPage({ searchParams }: PageProps<"/prescriptions">) {
  const { branch } = await pageContext();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const like = `%${q}%`;
  const rows = await sql`
    select r.id, r.date, r.mr, p.name, r.branch, r.diagnosis, count(*) over () as total
    from prescriptions r join patients p on p.mr = r.mr
    where (${branch}::text is null or r.branch = ${branch})
      and (${q} = '' or p.name ilike ${like} or r.mr ilike ${like} or r.diagnosis ilike ${like})
    order by r.date desc, r.id desc
    limit ${PAGE} offset ${(page - 1) * PAGE}`;
  const total = Number(rows[0]?.total ?? 0);
  return (
    <>
      <PageHeader title="Prescriptions" sub={`${total} prescriptions`}>
        <Link href="/prescriptions/sample" className="btn-ghost">
          Sample layout
        </Link>
        <Link href="/prescriptions/new" className="btn-gold">
          + New Prescription
        </Link>
      </PageHeader>
      <div className="mb-3">
        <SearchBox placeholder="Search patient, MR or diagnosis" />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Branch</th>
              <th>Diagnosis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap">
                  <Link href={`/prescriptions/${r.id}`} className="font-semibold text-navy hover:underline">
                    {prettyDate(r.date)}
                  </Link>
                </td>
                <td>
                  {r.name}
                  <div className="text-xs text-slate-400">{r.mr}</div>
                </td>
                <td>{r.branch}</td>
                <td className="max-w-md truncate text-slate-600">{r.diagnosis}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-slate-500">No prescriptions yet.</p>}
      </div>
      <Pager page={page} total={total} pageSize={PAGE} />
    </>
  );
}
