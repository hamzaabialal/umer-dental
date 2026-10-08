import { PageHeader } from "@/components/Shell";
import { sql } from "@/lib/db";
import { getBranches, getSettings } from "@/lib/data";
import { saveRate } from "@/lib/actions/settings";
import { requireAdmin } from "@/lib/session";
import { ClinicForm } from "./ClinicForm";
import { Users } from "./Users";

export default async function SettingsPage() {
  const me = await requireAdmin();
  const [settings, branches, rates, users] = await Promise.all([
    getSettings(),
    getBranches(),
    sql`select id, name, price, active from rates order by sort, name`,
    sql`select id, username, full_name, role, branch, active from users order by role, username`,
  ]);
  return (
    <>
      <PageHeader title="Settings" sub="Admin only" />
      <div className="space-y-5">
        <ClinicForm settings={settings} branches={branches} />
        <Users users={users as Parameters<typeof Users>[0]["users"]} meId={me.id} />
        <div className="card">
          <h2 className="mb-4 font-semibold text-navy">Treatment rate list</h2>
          <div className="space-y-1.5">
            {rates.map((r) => (
              <form key={r.id} action={saveRate} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="name" defaultValue={r.name} className="input min-w-0 flex-1" />
                <input name="price" type="number" min={0} defaultValue={r.price} className="input w-32" />
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input type="checkbox" name="active" defaultChecked={r.active} /> Active
                </label>
                <button className="btn-ghost px-2.5 py-1.5 text-xs">Save</button>
              </form>
            ))}
            <form action={saveRate} className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <input name="name" placeholder="New procedure" className="input min-w-0 flex-1" required />
              <input name="price" type="number" min={0} placeholder="Price" className="input w-32" required />
              <button className="btn-gold px-3 py-1.5 text-xs">Add</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
