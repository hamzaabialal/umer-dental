import "server-only";
import { sql } from "./db";
import { normPhone } from "./format";

export type Settings = {
  clinic_name: string;
  clinic_subtitle: string;
  tagline: string;
  doctor_name: string;
  doctor_qualification: string;
  email: string;
  website: string;
  secondary_phone: string;
  hours: string;
  whatsapp_number: string;
  signature_data_url: string;
};

export type BranchInfo = {
  code: string;
  name: string;
  address: string;
  phone: string;
  review_url: string;
  mr_prefix: string;
};

export type Patient = {
  mr: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string;
  branch: string;
  first_visit: string;
};

export async function getSettings(): Promise<Settings> {
  const [s] = await sql`select * from clinic_settings where id = 1`;
  return s as Settings;
}

export async function getBranches(): Promise<BranchInfo[]> {
  return (await sql`select * from branches order by code`) as BranchInfo[];
}

export async function getBranch(code: string): Promise<BranchInfo> {
  const [b] = await sql`select * from branches where code = ${code}`;
  return b as BranchInfo;
}

export async function getPatient(mr: string): Promise<Patient | null> {
  const [p] = await sql`select * from patients where mr = ${mr}`;
  return (p as Patient) ?? null;
}

/** Phone-first lookup. Empty / NIL phones never match, and at least 4 digits are needed for a phone match. */
export async function searchPatients(q: string, limit = 10): Promise<Patient[]> {
  q = q.trim();
  if (!q) return [];
  const digits = q.replace(/\D/g, "");
  const norm = normPhone(q);
  const isPhone = digits.length >= 4 && digits.length >= q.replace(/[\s+\-()]/g, "").length;
  if (isPhone) {
    return (await sql`
      select * from patients
      where phone_norm <> '' and (phone_norm like ${"%" + norm + "%"} or phone_norm like ${"%" + digits + "%"})
      order by phone_norm = ${norm} desc, name
      limit ${limit}`) as Patient[];
  }
  return (await sql`
    select * from patients
    where name ilike ${"%" + q + "%"} or mr ilike ${"%" + q + "%"}
    order by mr ilike ${q} desc, name
    limit ${limit}`) as Patient[];
}

/** Creates a patient with the next MR number for their branch. */
export async function createPatient(p: {
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string;
  branch: string;
  first_visit: string;
}): Promise<Patient> {
  const seq = p.branch === "PWD" ? "mr_seq_pwd" : "mr_seq_bahria";
  const prefix = p.branch === "PWD" ? "UDC-P-" : "UDC-B-";
  const [row] = await sql.query(
    `insert into patients (mr, name, phone, phone_norm, age, gender, address, branch, first_visit)
     values ($1 || lpad(nextval('${seq}')::text, 5, '0'), $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [prefix, p.name, p.phone, normPhone(p.phone), p.age, p.gender, p.address, p.branch, p.first_visit],
  );
  return row as Patient;
}

/** Reads the PatientPicker fields from a form: either an existing MR or new-patient details. */
export async function resolvePatientFromForm(form: FormData, branch: string, date: string): Promise<Patient> {
  const mr = String(form.get("patient_mr") ?? "").trim();
  if (mr) {
    const p = await getPatient(mr);
    if (!p) throw new Error("Selected patient not found");
    // Fill in details captured on this visit if the record didn't have them yet.
    const age = numOrNull(form.get("patient_age"));
    const gender = String(form.get("patient_gender") ?? "").trim() || null;
    const address = String(form.get("patient_address") ?? "").trim();
    if ((age !== null && age !== p.age) || (gender && gender !== p.gender) || (address && address !== p.address)) {
      const [u] = await sql`
        update patients set age = coalesce(${age}, age), gender = coalesce(${gender}, gender),
          address = case when ${address} <> '' then ${address} else address end
        where mr = ${mr} returning *`;
      return u as Patient;
    }
    return p;
  }
  const name = String(form.get("patient_name") ?? "").trim();
  const phone = String(form.get("patient_phone") ?? "").trim();
  if (!name) throw new Error("Patient name is required");
  return createPatient({
    name,
    phone,
    age: numOrNull(form.get("patient_age")),
    gender: String(form.get("patient_gender") ?? "").trim() || null,
    address: String(form.get("patient_address") ?? "").trim(),
    branch,
    first_visit: date,
  });
}

export function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function intOr0(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}
