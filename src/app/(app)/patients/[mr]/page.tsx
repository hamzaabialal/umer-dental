import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getBranch, getPatient } from "@/lib/data";
import { updatePatient } from "@/lib/actions/records";
import { pkr, prettyDate, prettyTime, rs, waLink } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function PatientPage({ params }: PageProps<"/patients/[mr]">) {
  const user = await requireUser();
  const mr = decodeURIComponent((await params).mr);
  const p = await getPatient(mr);
  if (!p) notFound();
  const canEdit = !user.branch || user.branch === p.branch;

  const [visits, invoices, rxs, appts, branch] = await Promise.all([
    sql`select date, visit_type, procedure, branch from opd_visits where mr = ${mr} order by date desc, id desc`,
    sql`select id, invoice_no, date, summary, net, paid_cash + paid_card as paid from invoices where mr = ${mr} order by date desc, id desc`,
    sql`select id, date, diagnosis from prescriptions where mr = ${mr} order by date desc, id desc`,
    sql`select id, date, time, procedure, status, branch from appointments where mr = ${mr} order by date desc, time desc`,
    getBranch(p.branch),
  ]);
  const balance = invoices.reduce((a, i) => a + Math.max(0, Number(i.net) - Number(i.paid)), 0);
  const q = `?mr=${encodeURIComponent(mr)}`;
  const waMsg = waLink(p.phone, `Dear ${p.name}, Umar Dental & Implant Center here.`);
  const waReview = branch.review_url
    ? waLink(p.phone, `Dear ${p.name}, thank you for visiting Umar Dental & Implant Center. We would appreciate your feedback:\n${branch.review_url}`)
    : null;

  return (
    <>
      <Link href="/patients" className="text-sm text-slate-500 hover:text-navy">
        ← Patients
      </Link>
      <div className="mt-1 mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{p.name}</h1>
          <p className="text-sm text-slate-500">
            {p.mr} • {p.phone || "No phone"} • {p.branch} • since {prettyDate(p.first_visit)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/appointments/new${q}`} className="btn-gold">Book appointment</Link>
          <Link href={`/opd/new${q}`} className="btn-ghost">OPD visit</Link>
          <Link href={`/invoices/new${q}`} className="btn-ghost">Invoice</Link>
          <Link href={`/prescriptions/new${q}`} className="btn-ghost">Prescription</Link>
          {waMsg && <a href={waMsg} target="_blank" rel="noopener" className="btn-wa">WhatsApp</a>}
          {waReview && <a href={waReview} target="_blank" rel="noopener" className="btn-ghost">Ask for review</a>}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          ["Visits", visits.length],
          ["Invoices", invoices.length],
          ["Total billed", pkr(invoices.reduce((a, i) => a + Number(i.net), 0))],
          ["Outstanding", pkr(balance)],
        ].map(([k, v]) => (
          <div key={k as string} className="card">
            <div className="text-xs text-slate-500">{k}</div>
            <div className={`mt-1 text-xl font-bold ${k === "Outstanding" && balance > 0 ? "text-red-700" : "text-navy"}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <form action={updatePatient} className="card h-fit space-y-3">
          <h2 className="font-semibold text-navy">Details</h2>
          <input type="hidden" name="mr" value={p.mr} />
          <fieldset disabled={!canEdit} className="space-y-3">
            <label className="label">Name<input name="name" defaultValue={p.name} className="input mt-1" /></label>
            <label className="label">Phone<input name="phone" defaultValue={p.phone} className="input mt-1" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="label">Age<input name="age" type="number" defaultValue={p.age ?? ""} className="input mt-1" /></label>
              <label className="label">
                Gender
                <select name="gender" defaultValue={p.gender ?? ""} className="input mt-1">
                  <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </label>
            </div>
            <label className="label">Address<input name="address" defaultValue={p.address} className="input mt-1" /></label>
            <button className="btn-primary w-full">Save details</button>
          </fieldset>
        </form>

        <div className="space-y-5">
          <Section title={`Appointments (${appts.length})`}>
            {appts.map((a) => (
              <Row key={a.id} href={`/appointments/${a.id}`} left={`${prettyDate(a.date)} • ${prettyTime(a.time)}`} mid={a.procedure} right={a.status} />
            ))}
          </Section>
          <Section title={`Invoices (${invoices.length})`}>
            {invoices.map((i) => {
              const bal = Number(i.net) - Number(i.paid);
              return (
                <Row
                  key={i.id}
                  href={`/invoices/${i.id}`}
                  left={`${i.invoice_no} • ${prettyDate(i.date)}`}
                  mid={i.summary}
                  right={bal > 0 ? <span className="text-red-700">Due {rs(bal)}</span> : `Rs. ${rs(i.net)}`}
                />
              );
            })}
          </Section>
          <Section title={`Prescriptions (${rxs.length})`}>
            {rxs.map((r) => (
              <Row key={r.id} href={`/prescriptions/${r.id}`} left={prettyDate(r.date)} mid={r.diagnosis} />
            ))}
          </Section>
          <Section title={`Visits (${visits.length})`}>
            {visits.map((v, i) => (
              <Row key={i} left={prettyDate(v.date)} mid={v.procedure} right={v.visit_type} />
            ))}
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode[] }) {
  return (
    <div className="card p-0">
      <h2 className="border-b border-slate-100 px-5 py-3 font-semibold text-navy">{title}</h2>
      <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
        {children.length ? children : <p className="px-5 py-4 text-sm text-slate-400">None yet.</p>}
      </div>
    </div>
  );
}

function Row({ href, left, mid, right }: { href?: string; left: string; mid?: string; right?: React.ReactNode }) {
  const body = (
    <div className="flex items-baseline gap-3 px-5 py-2.5 text-sm">
      <span className="w-48 shrink-0 font-medium whitespace-nowrap text-navy">{left}</span>
      <span className="flex-1 truncate text-slate-600">{mid}</span>
      {right && <span className="shrink-0 text-xs font-semibold text-slate-500">{right}</span>}
    </div>
  );
  return href ? <Link href={href} className="block hover:bg-slate-50">{body}</Link> : body;
}
