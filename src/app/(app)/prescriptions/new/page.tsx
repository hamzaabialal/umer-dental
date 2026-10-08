import { PageHeader } from "@/components/Shell";
import { todayPK } from "@/lib/format";
import { pageContext, prefillPatient } from "@/lib/page-helpers";
import { RxForm } from "./RxForm";

export default async function NewRxPage({ searchParams }: PageProps<"/prescriptions/new">) {
  const { writable, defaultBranch } = await pageContext();
  const patient = await prefillPatient(searchParams);
  return (
    <>
      <PageHeader title="New Prescription" />
      <RxForm
        today={todayPK()}
        branches={writable}
        defaultBranch={patient?.branch && writable.includes(patient.branch) ? patient.branch : defaultBranch}
        patient={patient}
      />
    </>
  );
}
