import { PageHeader } from "@/components/Shell";
import { todayPK } from "@/lib/format";
import { pageContext, prefillPatient } from "@/lib/page-helpers";
import { VisitForm } from "./VisitForm";

export default async function NewVisitPage({ searchParams }: PageProps<"/opd/new">) {
  const { writable, defaultBranch } = await pageContext();
  const patient = await prefillPatient(searchParams);
  return (
    <>
      <PageHeader title="Add OPD Visit" sub="No payment required — create an invoice separately if needed." />
      <VisitForm
        today={todayPK()}
        branches={writable}
        defaultBranch={patient?.branch && writable.includes(patient.branch) ? patient.branch : defaultBranch}
        patient={patient}
      />
    </>
  );
}
