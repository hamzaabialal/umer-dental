import { notFound } from "next/navigation";
import { RxDoc } from "@/components/docs/RxDoc";
import { PrintButton } from "@/components/PrintButton";
import { loadRx } from "@/lib/docs";

export const metadata = { title: "Prescription — Umar Dental & Implant Center", robots: { index: false } };

export default async function PublicRx({ params }: PageProps<"/r/[token]">) {
  const data = await loadRx({ token: (await params).token });
  if (!data) notFound();
  return (
    <main className="py-6 print:py-0">
      <div className="no-print mb-4 flex justify-center">
        <PrintButton label="Download / Print" />
      </div>
      <div className="overflow-x-auto">
        <RxDoc {...data} />
      </div>
    </main>
  );
}
