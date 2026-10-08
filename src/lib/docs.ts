import "server-only";
import { sql } from "./db";
import { getBranch, getPatient, getSettings } from "./data";
import type { InvoiceData } from "@/components/docs/InvoiceDoc";
import type { RxData } from "@/components/docs/RxDoc";

/** Loads everything needed to render an invoice, by id or by public share token. */
export async function loadInvoice(by: { id: number } | { token: string }) {
  const [inv] =
    "id" in by
      ? await sql`select * from invoices where id = ${by.id}`
      : await sql`select * from invoices where share_token = ${by.token}`;
  if (!inv) return null;
  const [items, patient, settings, branch] = await Promise.all([
    sql`select procedure, tooth, qty, rate, amount from invoice_items where invoice_id = ${inv.id} order by sort, id`,
    getPatient(inv.mr as string),
    getSettings(),
    getBranch(inv.branch as string),
  ]);
  return {
    invoice: { ...(inv as Omit<InvoiceData, "items">), items: items as InvoiceData["items"] } as InvoiceData & {
      id: number;
      share_token: string;
      mr: string;
      branch: string;
      historical: boolean;
    },
    patient: patient!,
    settings,
    branch,
  };
}

export async function loadRx(by: { id: number } | { token: string }) {
  const [rx] =
    "id" in by
      ? await sql`select * from prescriptions where id = ${by.id}`
      : await sql`select * from prescriptions where share_token = ${by.token}`;
  if (!rx) return null;
  const [items, patient, settings, branch] = await Promise.all([
    sql`select medicine, dose, instructions, days from prescription_items where prescription_id = ${rx.id} order by sort, id`,
    getPatient(rx.mr as string),
    getSettings(),
    getBranch(rx.branch as string),
  ]);
  return {
    rx: { ...(rx as Omit<RxData, "items">), items: items as RxData["items"] } as RxData & {
      id: number;
      share_token: string;
      mr: string;
      branch: string;
    },
    patient: patient!,
    settings,
    branch,
  };
}
