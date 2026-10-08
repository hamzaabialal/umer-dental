"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "../db";
import { requireAdmin } from "../session";
import { intOr0 } from "../data";

const str = (form: FormData, k: string) => String(form.get(k) ?? "").trim();

export async function saveClinicSettings(_prev: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  let signature: string | null = null;
  const file = form.get("signature");
  if (file instanceof File && file.size > 0) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return "Signature must be a PNG, JPG or WEBP image.";
    if (file.size > 300_000) return "Signature image must be under 300 KB.";
    signature = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  }
  if (form.get("remove_signature") === "1") signature = "";

  await sql`
    update clinic_settings set
      clinic_name = ${str(form, "clinic_name")}, clinic_subtitle = ${str(form, "clinic_subtitle")},
      tagline = ${str(form, "tagline")}, doctor_name = ${str(form, "doctor_name")},
      doctor_qualification = ${str(form, "doctor_qualification")}, email = ${str(form, "email")},
      website = ${str(form, "website")}, secondary_phone = ${str(form, "secondary_phone")},
      hours = ${str(form, "hours")}, whatsapp_number = ${str(form, "whatsapp_number")},
      signature_data_url = coalesce(${signature}, signature_data_url)
    where id = 1`;
  for (const code of ["Bahria", "PWD"]) {
    await sql`
      update branches set name = ${str(form, `${code}_name`)}, address = ${str(form, `${code}_address`)},
        phone = ${str(form, `${code}_phone`)}, review_url = ${str(form, `${code}_review_url`)}
      where code = ${code}`;
  }
  revalidatePath("/", "layout");
  return "ok";
}

export async function saveRate(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id")) || null;
  const name = str(form, "name");
  const price = intOr0(form.get("price"));
  if (!name) return;
  if (id) await sql`update rates set name = ${name}, price = ${price}, active = ${form.get("active") === "on"} where id = ${id}`;
  else await sql`insert into rates (name, price, sort) values (${name}, ${price}, 999) on conflict (name) do update set price = excluded.price, active = true`;
  revalidatePath("/settings");
}

export async function createUser(_prev: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  const username = str(form, "username").toLowerCase();
  const role = str(form, "role");
  const branch = str(form, "branch") || null;
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return "Username: 3–30 letters, numbers, dot, dash or underscore.";
  if (!["admin", "doctor", "receptionist"].includes(role)) return "Choose a role.";
  if (role === "receptionist" && !branch) return "Receptionists must be assigned to a branch.";
  const password = randomBytes(6).toString("base64url");
  try {
    await sql`
      insert into users (username, full_name, role, branch, password_hash)
      values (${username}, ${str(form, "full_name") || username}, ${role}, ${role === "receptionist" ? branch : null},
              ${await bcrypt.hash(password, 12)})`;
  } catch {
    return "That username is already taken.";
  }
  revalidatePath("/settings");
  return `PASSWORD:${username}:${password}`;
}

export async function resetUserPassword(_prev: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const password = randomBytes(6).toString("base64url");
  const [u] = await sql`
    update users set password_hash = ${await bcrypt.hash(password, 12)}, failed_attempts = 0, locked_until = null
    where id = ${id} returning username`;
  if (!u) return "User not found.";
  return `PASSWORD:${u.username}:${password}`;
}

export async function toggleUser(form: FormData) {
  const admin = await requireAdmin();
  const id = Number(form.get("id"));
  if (id === admin.id) return; // never lock yourself out
  await sql`update users set active = not active where id = ${id}`;
  revalidatePath("/settings");
}
