import Link from "next/link";
import { notFound } from "next/navigation";
import { RxDoc } from "@/components/docs/RxDoc";
import { PrintButton } from "@/components/PrintButton";
import { loadRx } from "@/lib/docs";
import { prettyDate, waLink } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { baseUrl } from "@/lib/url";

export default async function RxPage({ params }: PageProps<"/prescriptions/[id]">) {
  const user = await requireUser();
  const data = await loadRx({ id: Number((await params).id) });
  if (!data || (user.branch && user.branch !== data.rx.branch)) notFound();
  const { rx, patient } = data;
  const wa = waLink(
    patient.phone,
    `Dear ${patient.name}, here is your prescription from ${data.settings.clinic_name} ${data.settings.clinic_subtitle} (${prettyDate(rx.date)}):\n${await baseUrl()}/r/${rx.share_token}`,
  );
  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/prescriptions" className="text-sm text-slate-500 hover:text-navy">
            ← Prescriptions
          </Link>
          <h1 className="text-2xl font-bold text-navy">
            Prescription — {patient.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="btn-wa">
              Send on WhatsApp
            </a>
          )}
          <Link href={`/invoices/new?mr=${encodeURIComponent(patient.mr)}`} className="btn-gold">
            Create invoice
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto pb-6 print:overflow-visible print:pb-0">
        <RxDoc {...data} />
      </div>
    </>
  );
}
