import { PageHeader } from "@/components/Shell";
import { todayPK } from "@/lib/format";
import { pageContext } from "@/lib/page-helpers";
import { PatientForm } from "./PatientForm";

export default async function NewPatientPage() {
  const { writable, defaultBranch } = await pageContext();
  return (
    <>
      <PageHeader title="Add Patient" />
      <PatientForm branches={writable} defaultBranch={defaultBranch} today={todayPK()} />
    </>
  );
}
