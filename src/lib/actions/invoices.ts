"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "../db";
import { assertBranch, requireUser } from "../session";
import { intOr0, resolvePatientFromForm } from "../data";
import { PAYMENT_METHODS, todayPK } from "../format";

type Item = { procedure: string; tooth: string; qty: number; rate: number };

export async function createInvoice(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser();
  let id: number;
  try {
    const branch = assertBranch(user, String(form.get("branch")));
    const date = String(form.get("date") || todayPK());
    const raw = JSON.parse(String(form.get("items") || "[]")) as Item[];
    const items = raw
      .map((it) => ({
        procedure: String(it.procedure ?? "").trim(),
        tooth: String(it.tooth ?? "").trim(),
        qty: Math.max(1, intOr0(it.qty)),
        rate: intOr0(it.rate),
      }))
      .filter((it) => it.procedure);
    if (!items.length) return "Add at least one procedure.";

    const total = items.reduce((a, it) => a + it.qty * it.rate, 0);
    const discount = intOr0(form.get("discount"));
    if (discount > total) return "Discount can't be more than the total charges.";
    const net = total - discount;
    const paidCash = intOr0(form.get("paid_cash"));
    const paidCard = intOr0(form.get("paid_card"));
    if (paidCash + paidCard > net) return `Amount paid (Rs. ${paidCash + paidCard}) is more than the net amount (Rs. ${net}).`;
    const method = String(form.get("payment_method") || "");
    if (method && !(PAYMENT_METHODS as readonly string[]).includes(method)) return "Invalid payment method.";

    const patient = await resolvePatientFromForm(form, branch, date);

    const [row] = await sql.query(
      `with inv as (
         insert into invoices (invoice_no, date, mr, branch, total_charges, discount, net, paid_cash, paid_card,
                               payment_method, remarks, summary, created_by)
         values ('UDC-INV-' || lpad(nextval('invoice_seq')::text, 5, '0'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         returning id
       ), items as (
         insert into invoice_items (invoice_id, sort, procedure, tooth, qty, rate, amount)
         select inv.id, s, p, t, q, r, q * r
         from inv, unnest($13::int[], $14::text[], $15::text[], $16::int[], $17::int[]) as u(s, p, t, q, r)
       )
       select id from inv`,
      [
        date, patient.mr, branch, total, discount, net, paidCash, paidCard, method || null,
        String(form.get("remarks") ?? "").trim(),
        items.map((it) => (it.tooth ? `${it.procedure} (${it.tooth})` : it.procedure)).join(", "),
        user.id,
        items.map((_, i) => i), items.map((it) => it.procedure), items.map((it) => it.tooth),
        items.map((it) => it.qty), items.map((it) => it.rate),
      ],
    );
    id = row.id as number;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save invoice.";
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

/** Records a later payment against an invoice's pending balance. */
export async function addPayment(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get("id"));
  const amount = intOr0(form.get("amount"));
  const via = String(form.get("via")) === "card" ? "card" : "cash";
  const [inv] = await sql`select branch, net - paid_cash - paid_card as due from invoices where id = ${id}`;
  if (!inv || !amount || amount > Number(inv.due)) return;
  assertBranch(user, inv.branch as string);
  if (via === "card") await sql`update invoices set paid_card = paid_card + ${amount} where id = ${id}`;
  else await sql`update invoices set paid_cash = paid_cash + ${amount} where id = ${id}`;
  revalidatePath(`/invoices/${id}`);
}
