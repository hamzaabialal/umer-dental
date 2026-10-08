import { PageHeader } from "@/components/Shell";
import { InvoiceDoc } from "@/components/docs/InvoiceDoc";
import { PrintButton } from "@/components/PrintButton";
import { getBranch, getSettings } from "@/lib/data";
import { sampleInvoice, samplePatient } from "@/lib/sample";
import { requireUser } from "@/lib/session";

export default async function SampleInvoicePage() {
  await requireUser();
  const [settings, branch] = await Promise.all([getSettings(), getBranch("Bahria")]);
  return (
    <>
      <PageHeader title="Sample Invoice" sub="Reference-design data, rendered with your clinic settings. Nothing is saved.">
        <PrintButton />
      </PageHeader>
      <div className="overflow-x-auto pb-6 print:overflow-visible print:pb-0">
        <InvoiceDoc invoice={sampleInvoice} patient={samplePatient} settings={settings} branch={branch} />
      </div>
    </>
  );
}
