import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Pager, SearchBox } from "@/components/ListControls";
import { sql } from "@/lib/db";
import { normPhone, prettyDate } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";

const PAGE = 50;

export default async function PatientsPage({ searchParams }: PageProps<"/patients">) {
  const { branch } = await pageContext();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const like = `%${q}%`;
  const digits = q.replace(/\D/g, "");
  const phoneLike = digits.length >= 4 ? `%${normPhone(q) || digits}%` : null;

  const rows = await sql`
    select p.mr, p.name, p.phone, p.branch, p.first_visit,
           (select max(date) from opd_visits v where v.mr = p.mr) as last_visit,
           count(*) over () as total
    from patients p
    where (${branch}::text is null or p.branch = ${branch})
      and (${q} = '' or p.name ilike ${like} or p.mr ilike ${like}
           or (${phoneLike}::text is not null and p.phone_norm <> '' and p.phone_norm like ${phoneLike}))
    order by p.mr desc
    limit ${PAGE} offset ${(page - 1) * PAGE}`;
  const total = Number(rows[0]?.total ?? 0);

  return (
    <>
      <PageHeader title="Patients" sub={`${total.toLocaleString()} patients`}>
        <Link href="/patients/new" className="btn-gold">
          + Add Patient
        </Link>
      </PageHeader>
      <div className="mb-3">
        <SearchBox placeholder="Search by phone, name or MR number" />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>MR #</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>First visit</th>
              <th>Last visit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.mr} className="hover:bg-slate-50">
                <td>
                  <Link href={`/patients/${encodeURIComponent(p.mr)}`} className="font-semibold text-navy hover:underline">
                    {p.mr}
                  </Link>
                </td>
                <td>
                  <Link href={`/patients/${encodeURIComponent(p.mr)}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td>{p.phone || <span className="text-slate-400">—</span>}</td>
                <td>{p.branch}</td>
                <td className="whitespace-nowrap">{prettyDate(p.first_visit)}</td>
                <td className="whitespace-nowrap">{p.last_visit ? prettyDate(p.last_visit) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-slate-500">No patients found.</p>}
      </div>
      <Pager page={page} total={total} pageSize={PAGE} />
    </>
  );
}
