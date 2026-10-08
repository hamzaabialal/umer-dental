"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "../db";
import { assertBranch, requireUser } from "../session";
import { resolvePatientFromForm } from "../data";
import { todayPK } from "../format";

type Med = { medicine: string; dose: string; instructions: string; days: string };

export async function createPrescription(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser();
  let id: number;
  try {
    const branch = assertBranch(user, String(form.get("branch")));
    const date = String(form.get("date") || todayPK());
    const meds = (JSON.parse(String(form.get("items") || "[]")) as Med[])
      .map((m) => ({
        medicine: String(m.medicine ?? "").trim(),
        dose: String(m.dose ?? "").trim(),
        instructions: String(m.instructions ?? "").trim(),
        days: String(m.days ?? "").trim(),
      }))
      .filter((m) => m.medicine);
    const diagnosis = String(form.get("diagnosis") ?? "").trim();
    if (!diagnosis && !meds.length) return "Enter a diagnosis or at least one medicine.";

    const patient = await resolvePatientFromForm(form, branch, date);
    const [row] = await sql.query(
      `with rx as (
         insert into prescriptions (date, mr, branch, diagnosis, treatment_done, advice, created_by)
         values ($1, $2, $3, $4, $5, $6, $7) returning id
       ), items as (
         insert into prescription_items (prescription_id, sort, medicine, dose, instructions, days)
         select rx.id, s, m, d, i, n from rx, unnest($8::int[], $9::text[], $10::text[], $11::text[], $12::text[]) as u(s, m, d, i, n)
       )
       select id from rx`,
      [
        date, patient.mr, branch, diagnosis,
        String(form.get("treatment_done") ?? "").trim(),
        String(form.get("advice") ?? "").trim(),
        user.id,
        meds.map((_, i) => i), meds.map((m) => m.medicine), meds.map((m) => m.dose),
        meds.map((m) => m.instructions), meds.map((m) => m.days),
      ],
    );
    id = row.id as number;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save prescription.";
  }
  revalidatePath("/prescriptions");
  redirect(`/prescriptions/${id}`);
}
