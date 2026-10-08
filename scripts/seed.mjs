// One-time import of the historical data embedded in the old single-file app,
// plus clinic settings, branches, the rate list and the first login accounts.
// Usage: node --env-file=.env.local scripts/seed.mjs [path/to/old.html]
// Refuses to run if patients already exist, so it can't duplicate data.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL);
const htmlPath =
  process.argv[2] ??
  new URL("../../Umar_Dental_Clinic_Management_FINAL_SEP2026.html", import.meta.url);

const [{ count }] = await sql`select count(*)::int as count from patients`;
if (count > 0) {
  console.error(`Database already has ${count} patients — refusing to seed again.`);
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");
const start = html.indexOf("INITIAL_DATA=") + "INITIAL_DATA=".length;
const end = html.indexOf("};", start) + 1;
const data = JSON.parse(html.slice(start, end));

function normPhone(v) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(2);
  else if (d.startsWith("03")) d = "92" + d.slice(1);
  else if (d.length === 10 && d.startsWith("3")) d = "92" + d;
  return d;
}
const cleanPhone = (v) => (/^nil$/i.test(String(v ?? "").trim()) ? "" : String(v ?? "").trim());

// ---- settings & branches ----
await sql`insert into clinic_settings (id) values (1) on conflict do nothing`;
await sql`
  insert into branches (code, name, address, phone, review_url, mr_prefix) values
  ('Bahria', 'BAHRIA BRANCH', 'Plaza 15, Opp. Mini Golf Club, Corniche Road, Bahria Town Phase 4, Rawalpindi',
   '03310009851', 'https://g.page/r/CWWD3k-qI-_nEAE/review', 'UDC-B-'),
  ('PWD', 'PWD BRANCH', 'Specialist Care Hospital, Opp. Doctors Town, Main PWD Road, NPF O-9, Islamabad',
   '03310009842', 'https://g.page/r/Cajln_LkOwyREBM/review', 'UDC-P-')
  on conflict (code) do nothing`;

// ---- rates ----
await sql.query(
  `insert into rates (name, price, sort)
   select * from unnest($1::text[], $2::int[], $3::int[]) on conflict (name) do nothing`,
  [data.rates.map((r) => r.name), data.rates.map((r) => Math.round(r.price)), data.rates.map((_, i) => i)],
);

// ---- patients ----
const P = data.patients;
await sql.query(
  `insert into patients (mr, name, phone, phone_norm, branch, first_visit)
   select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[])`,
  [
    P.map((p) => p.mr),
    P.map((p) => p.name.trim()),
    P.map((p) => cleanPhone(p.phone)),
    P.map((p) => normPhone(cleanPhone(p.phone))),
    P.map((p) => p.branch),
    P.map((p) => p.first),
  ],
);
const maxMr = (prefix) =>
  Math.max(0, ...P.filter((p) => p.mr.startsWith(prefix)).map((p) => Number(p.mr.slice(-5)) || 0));
await sql.query(`select setval('mr_seq_bahria', $1, $2)`, [Math.max(1, maxMr("UDC-B-")), maxMr("UDC-B-") > 0]);
await sql.query(`select setval('mr_seq_pwd', $1, $2)`, [Math.max(1, maxMr("UDC-P-")), maxMr("UDC-P-") > 0]);

// ---- OPD visits ----
const V = data.opd;
await sql.query(
  `insert into opd_visits (legacy_id, date, mr, branch, visit_type, procedure, historical)
   select l, d, m, b, t, p, true from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[]) as u(l, d, m, b, t, p)`,
  [V.map((v) => v.id), V.map((v) => v.date), V.map((v) => v.mr), V.map((v) => v.branch), V.map((v) => v.type), V.map((v) => v.procedure ?? "")],
);

// ---- invoices (one line item each — the old data only kept a procedure summary) ----
const I = data.payments;
const inserted = await sql.query(
  `insert into invoices (invoice_no, date, mr, branch, total_charges, discount, net, paid_cash, summary, historical)
   select n, d, m, b, g, disc, net, paid, s, true
   from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::int[], $7::int[], $8::int[], $9::text[])
     as u(n, d, m, b, g, disc, net, paid, s)
   returning id, invoice_no`,
  [
    I.map((x) => x.invoice), I.map((x) => x.date), I.map((x) => x.mr), I.map((x) => x.branch),
    I.map((x) => Math.round(x.gross)), I.map((x) => Math.round(x.discount || 0)),
    I.map((x) => Math.round(x.net)), I.map((x) => Math.round(x.paid)), I.map((x) => x.procedure ?? ""),
  ],
);
const idByNo = new Map(inserted.map((r) => [r.invoice_no, r.id]));
await sql.query(
  `insert into invoice_items (invoice_id, procedure, qty, rate, amount)
   select i, p, 1, a, a from unnest($1::int[], $2::text[], $3::int[]) as u(i, p, a)`,
  [I.map((x) => idByNo.get(x.invoice)), I.map((x) => x.procedure || "Treatment"), I.map((x) => Math.round(x.gross))],
);
await sql.query(`select setval('invoice_seq', $1)`, [data.meta.lastHistoricalInvoice]);

// ---- expenses ----
for (const e of data.expenses) {
  await sql`insert into expenses (legacy_id, date, branch, category, description, amount, historical)
            values (${e.id}, ${e.date}, ${e.branch}, ${e.category}, ${e.description}, ${Math.round(e.amount)}, true)`;
}

// ---- login accounts ----
const accounts = [
  { username: "drumar", full_name: "Dr. Umar Akhtar", role: "admin", branch: null },
  { username: "bahria", full_name: "Bahria Reception", role: "receptionist", branch: "Bahria" },
  { username: "pwd", full_name: "PWD Reception", role: "receptionist", branch: "PWD" },
];
console.log("\nLogin accounts (shown once — save these, then change them after first login):");
for (const a of accounts) {
  const password = randomBytes(6).toString("base64url");
  const hash = await bcrypt.hash(password, 12);
  await sql`insert into users (username, full_name, role, branch, password_hash)
            values (${a.username}, ${a.full_name}, ${a.role}, ${a.branch}, ${hash})`;
  console.log(`  ${a.role.padEnd(13)} username: ${a.username.padEnd(8)} password: ${password}`);
}

console.log(
  `\nImported ${P.length} patients, ${V.length} OPD visits, ${I.length} invoices, ${data.expenses.length} expenses, ${data.rates.length} rates.`,
);
