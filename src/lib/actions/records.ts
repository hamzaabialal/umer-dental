"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "../db";
import { assertBranch, requireUser } from "../session";
import { createPatient, getPatient, intOr0, numOrNull, resolvePatientFromForm } from "../data";
import { normPhone, todayPK, VISIT_TYPES } from "../format";

export async function addPatient(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser();
  let mr: string;
  try {
    const branch = assertBranch(user, String(form.get("branch")));
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (!name) return "Patient name is required.";
    const n = normPhone(phone);
    if (n) {
      const [dup] = await sql`select mr, name from patients where phone_norm = ${n} limit 1`;
      if (dup && form.get("confirm_dup") !== "1")
        return `DUP:This number already belongs to ${dup.name} (${dup.mr}). Save again to add another family member on the same number.`;
    }
    const p = await createPatient({
      name,
      phone,
      age: numOrNull(form.get("age")),
      gender: String(form.get("gender") ?? "") || null,
      address: String(form.get("address") ?? "").trim(),
      branch,
      first_visit: String(form.get("first_visit") || todayPK()),
    });
    mr = p.mr;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save patient.";
  }
  revalidatePath("/patients");
  redirect(`/patients/${encodeURIComponent(mr)}`);
}

export async function updatePatient(form: FormData) {
  const user = await requireUser();
  const mr = String(form.get("mr"));
  const p = await getPatient(mr);
  if (!p) return;
  if (user.branch && user.branch !== p.branch) throw new Error("Not your branch");
  const phone = String(form.get("phone") ?? "").trim();
  await sql`
    update patients set
      name = ${String(form.get("name") ?? p.name).trim() || p.name},
      phone = ${phone}, phone_norm = ${normPhone(phone)},
      age = ${numOrNull(form.get("age"))},
      gender = ${String(form.get("gender") ?? "") || null},
      address = ${String(form.get("address") ?? "").trim()}
    where mr = ${mr}`;
  revalidatePath(`/patients/${mr}`);
}

export async function addVisit(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser();
  try {
    const branch = assertBranch(user, String(form.get("branch")));
    const date = String(form.get("date") || todayPK());
    const type = String(form.get("visit_type"));
    if (!VISIT_TYPES.includes(type)) return "Choose a visit type.";
    const p = await resolvePatientFromForm(form, branch, date);
    await sql`
      insert into opd_visits (date, mr, branch, visit_type, procedure, created_by)
      values (${date}, ${p.mr}, ${branch}, ${type}, ${String(form.get("procedure") ?? "").trim()}, ${user.id})`;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save visit.";
  }
  revalidatePath("/opd");
  redirect("/opd?saved=1");
}

export async function addExpense(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser();
  try {
    const branch = assertBranch(user, String(form.get("branch")));
    const amount = intOr0(form.get("amount"));
    if (!amount) return "Enter an amount.";
    await sql`
      insert into expenses (date, branch, category, description, amount, created_by)
      values (${String(form.get("date") || todayPK())}, ${branch}, ${String(form.get("category") ?? "").trim()},
              ${String(form.get("description") ?? "").trim()}, ${amount}, ${user.id})`;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save expense.";
  }
  revalidatePath("/expenses");
  return "ok";
}
