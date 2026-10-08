import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceDoc } from "@/components/docs/InvoiceDoc";
import { PrintButton } from "@/components/PrintButton";
import { addPayment } from "@/lib/actions/invoices";
import { loadInvoice } from "@/lib/docs";
import { pkr, waLink } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { baseUrl } from "@/lib/url";

export default async function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  const user = await requireUser();
  const data = await loadInvoice({ id: Number((await params).id) });
  if (!data || (user.branch && user.branch !== data.invoice.branch)) notFound();
  const { invoice, patient } = data;
  const pending = invoice.net - invoice.paid_cash - invoice.paid_card;
  const link = `${await baseUrl()}/i/${invoice.share_token}`;
  const wa = waLink(
    patient.phone,
    `Dear ${patient.name}, thank you for visiting ${data.settings.clinic_name} ${data.settings.clinic_subtitle}.\n` +
      `Your invoice ${invoice.invoice_no} (Net ${pkr(invoice.net)}${pending > 0 ? `, pending ${pkr(pending)}` : ""}):\n${link}` +
      (data.branch.review_url ? `\n\nWe'd love your feedback: ${data.branch.review_url}` : ""),
  );

  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/invoices" className="text-sm text-slate-500 hover:text-navy">
            ← Invoices
          </Link>
          <h1 className="text-2xl font-bold text-navy">{invoice.invoice_no}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="btn-wa">
              Send on WhatsApp
            </a>
          )}
          <Link href={`/patients/${encodeURIComponent(patient.mr)}`} className="btn-ghost">
            Patient profile
          </Link>
        </div>
      </div>

      {pending > 0 && (
        <form action={addPayment} className="no-print card mb-5 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={invoice.id} />
          <div className="text-sm">
            <div className="font-semibold text-red-700">Pending: {pkr(pending)}</div>
            <div className="text-slate-500">Record a later payment</div>
          </div>
          <input name="amount" type="number" min={1} max={pending} defaultValue={pending} className="input w-36" />
          <select name="via" className="input w-36">
            <option value="cash">Cash</option>
            <option value="card">Card / Online</option>
          </select>
          <button className="btn-primary">Add payment</button>
        </form>
      )}

      <div className="overflow-x-auto pb-6 print:overflow-visible print:pb-0">
        <InvoiceDoc {...data} />
      </div>
    </>
  );
}
