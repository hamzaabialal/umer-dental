import { notFound } from "next/navigation";
import { InvoiceDoc } from "@/components/docs/InvoiceDoc";
import { PrintButton } from "@/components/PrintButton";
import { loadInvoice } from "@/lib/docs";

export const metadata = { title: "Invoice — Umar Dental & Implant Center", robots: { index: false } };

/** Public, unguessable-link view of an invoice for the patient. */
export default async function PublicInvoice({ params }: PageProps<"/i/[token]">) {
  const data = await loadInvoice({ token: (await params).token });
  if (!data) notFound();
  return (
    <main className="py-6 print:py-0">
      <div className="no-print mb-4 flex justify-center">
        <PrintButton label="Download / Print" />
      </div>
      <div className="overflow-x-auto">
        <InvoiceDoc {...data} />
      </div>
    </main>
  );
}
