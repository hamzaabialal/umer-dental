import { PageHeader } from "@/components/Shell";
import { sql } from "@/lib/db";
import { pkr, prettyDate, rs, todayPK } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";
import { ExpenseForm } from "./ExpenseForm";

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const { branch, writable, defaultBranch } = await pageContext();
  const sp = await searchParams;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : todayPK().slice(0, 7);
  const rows = await sql`
    select id, date, branch, category, description, amount from expenses
    where (${branch}::text is null or branch = ${branch}) and date like ${month + "%"}
    order by date desc, id desc`;
  const total = rows.reduce((a, r) => a + Number(r.amount), 0);
  return (
    <>
      <PageHeader title="Expenses" sub={`${pkr(total)} in ${month}`}>
        <form className="flex gap-2">
          <input type="month" name="month" defaultValue={month} className="input w-auto" />
          <button className="btn-ghost">Show</button>
        </form>
      </PageHeader>
      <ExpenseForm branches={writable} defaultBranch={defaultBranch} today={todayPK()} />
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Branch</th>
              <th>Category</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap">{prettyDate(r.date)}</td>
                <td>{r.branch}</td>
                <td>{r.category}</td>
                <td className="text-slate-600">{r.description}</td>
                <td className="text-right font-semibold">{rs(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-slate-500">No expenses this month.</p>}
      </div>
    </>
  );
}
