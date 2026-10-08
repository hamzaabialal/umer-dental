import { PageHeader } from "@/components/Shell";
import { sql } from "@/lib/db";
import { todayPK } from "@/lib/format";
import { pageContext, prefillPatient } from "@/lib/page-helpers";
import { AppointmentForm } from "./AppointmentForm";

export default async function NewAppointmentPage({ searchParams }: PageProps<"/appointments/new">) {
  const { writable, defaultBranch } = await pageContext();
  const [rates, patient] = await Promise.all([
    sql`select name from rates where active order by sort, name`,
    prefillPatient(searchParams),
  ]);
  const date = (await searchParams).date;
  return (
    <>
      <PageHeader title="Book Appointment" sub="The patient gets a confirmation link that adds the appointment to their phone's calendar." />
      <AppointmentForm
        today={todayPK()}
        branches={writable}
        defaultBranch={patient?.branch && writable.includes(patient.branch) ? patient.branch : defaultBranch}
        procedures={rates.map((r) => r.name as string)}
        patient={patient}
        date={typeof date === "string" ? date : undefined}
      />
    </>
  );
}
