"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "../db";
import { assertBranch, requireUser } from "../session";
import { intOr0, resolvePatientFromForm } from "../data";
import { APPT_STATUSES } from "../format";

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s: string) => /^\d{2}:\d{2}$/.test(s);

export async function createAppointment(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser();
  let id: number;
  try {
    const branch = assertBranch(user, String(form.get("branch")));
    const date = String(form.get("date"));
    const time = String(form.get("time"));
    if (!isDate(date) || !isTime(time)) return "Choose a valid date and time.";
    const duration = Math.min(480, Math.max(10, intOr0(form.get("duration_min")) || 30));

    const patient = await resolvePatientFromForm(form, branch, date);
    const [row] = await sql`
      insert into appointments (mr, branch, date, time, duration_min, procedure, status, notes, created_by)
      values (${patient.mr}, ${branch}, ${date}, ${time}, ${duration},
              ${String(form.get("procedure") ?? "").trim()}, 'Booked', ${String(form.get("notes") ?? "").trim()}, ${user.id})
      returning id`;
    id = row.id as number;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not book appointment.";
  }
  revalidatePath("/appointments");
  redirect(`/appointments/${id}?created=1`);
}

export async function updateAppointment(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get("id"));
  const [a] = await sql`select branch from appointments where id = ${id}`;
  if (!a) return;
  assertBranch(user, a.branch as string);

  const status = String(form.get("status") ?? "");
  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "");
  if (status && (APPT_STATUSES as readonly string[]).includes(status)) {
    await sql`update appointments set status = ${status}, updated_at = now() where id = ${id}`;
  }
  if (isDate(date) && isTime(time)) {
    await sql`update appointments set date = ${date}, time = ${time}, updated_at = now() where id = ${id}`;
  }
  revalidatePath(`/appointments/${id}`);
  revalidatePath("/appointments");
}
