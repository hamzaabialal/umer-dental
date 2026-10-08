import { PageHeader } from "@/components/Shell";
import { RxDoc } from "@/components/docs/RxDoc";
import { PrintButton } from "@/components/PrintButton";
import { getBranch, getSettings } from "@/lib/data";
import { sampleRx, samplePatient } from "@/lib/sample";
import { requireUser } from "@/lib/session";

export default async function SampleRxPage() {
  await requireUser();
  const [settings, branch] = await Promise.all([getSettings(), getBranch("Bahria")]);
  return (
    <>
      <PageHeader title="Sample Prescription" sub="Reference-design data, rendered with your clinic settings. Nothing is saved.">
        <PrintButton />
      </PageHeader>
      <div className="overflow-x-auto pb-6 print:overflow-visible print:pb-0">
        <RxDoc rx={sampleRx} patient={samplePatient} settings={settings} branch={branch} />
      </div>
    </>
  );
}
