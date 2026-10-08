import { PageHeader } from "@/components/Shell";
import { sql } from "@/lib/db";
import { todayPK } from "@/lib/format";
import { pageContext, prefillPatient } from "@/lib/page-helpers";
import { InvoiceForm } from "./InvoiceForm";

export default async function NewInvoicePage({ searchParams }: PageProps<"/invoices/new">) {
  const { writable, defaultBranch } = await pageContext();
  const [rates, patient] = await Promise.all([
    sql`select name, price from rates where active order by sort, name`,
    prefillPatient(searchParams),
  ]);
  return (
    <>
      <PageHeader title="New Invoice" sub="Look up the patient by phone, add procedures, and generate the receipt." />
      <InvoiceForm
        rates={rates as { name: string; price: number }[]}
        today={todayPK()}
        branches={writable}
        defaultBranch={patient?.branch && writable.includes(patient.branch) ? patient.branch : defaultBranch}
        patient={patient}
      />
    </>
  );
}
