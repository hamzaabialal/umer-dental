import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Pager, SearchBox } from "@/components/ListControls";
import { sql } from "@/lib/db";
import { prettyDate, rs } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";

const PAGE = 50;

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  const { branch } = await pageContext();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const like = `%${q}%`;
  const due = sp.due === "1";

  const rows = await sql`
    select i.id, i.invoice_no, i.date, i.mr, p.name, i.branch, i.summary, i.net,
           i.paid_cash + i.paid_card as paid, i.historical, count(*) over () as total
    from invoices i join patients p on p.mr = i.mr
    where (${branch}::text is null or i.branch = ${branch})
      and (${q} = '' or i.invoice_no ilike ${like} or p.name ilike ${like} or i.mr ilike ${like} or i.summary ilike ${like})
      and (not ${due} or i.net > i.paid_cash + i.paid_card)
    order by i.date desc, i.id desc
    limit ${PAGE} offset ${(page - 1) * PAGE}`;
  const total = Number(rows[0]?.total ?? 0);

  return (
    <>
      <PageHeader title="Invoices" sub={`${total.toLocaleString()} invoices`}>
        <Link href="/invoices/sample" className="btn-ghost">
          Sample layout
        </Link>
        <Link href="/invoices/new" className="btn-gold">
          + New Invoice
        </Link>
      </PageHeader>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchBox placeholder="Search invoice no, patient, MR or procedure" />
        <Link href={due ? "/invoices" : "/invoices?due=1"} className={due ? "btn-primary" : "btn-ghost"}>
          Pending only
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Patient</th>
              <th>Procedure</th>
              <th className="text-right">Net</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const bal = Number(r.net) - Number(r.paid);
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/invoices/${r.id}`} className="font-semibold text-navy hover:underline">
                      {r.invoice_no}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap">{prettyDate(r.date)}</td>
                  <td>
                    {r.name}
                    <div className="text-xs text-slate-400">
                      {r.mr} • {r.branch}
                    </div>
                  </td>
                  <td className="max-w-xs truncate text-slate-600">{r.summary}</td>
                  <td className="text-right">{rs(r.net)}</td>
                  <td className="text-right">{rs(r.paid)}</td>
                  <td className={`text-right font-semibold ${bal > 0 ? "text-red-700" : "text-slate-400"}`}>{rs(bal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-slate-500">No invoices found.</p>}
      </div>
      <Pager page={page} total={total} pageSize={PAGE} />
    </>
  );
}
