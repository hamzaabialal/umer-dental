import "server-only";
import { sql } from "./db";
import type { CalAppt } from "./calendar";

export type Appt = CalAppt & {
  share_token: string;
  mr: string;
  branch: string;
};

const SELECT = `
  select a.id, a.share_token, a.mr, a.branch, a.date, a.time, a.duration_min, a.procedure, a.status, a.notes,
         p.name as patient_name, p.phone as patient_phone,
         b.name as branch_name, b.address as branch_address, b.phone as branch_phone
  from appointments a
  join patients p on p.mr = a.mr
  join branches b on b.code = a.branch`;

export async function getAppt(by: { id: number } | { token: string }): Promise<Appt | null> {
  const rows =
    "id" in by
      ? await sql.query(`${SELECT} where a.id = $1`, [by.id])
      : await sql.query(`${SELECT} where a.share_token = $1`, [by.token]);
  return (rows[0] as Appt) ?? null;
}

export async function listAppts(opts: { from: string; to: string; branch: string | null }): Promise<Appt[]> {
  return (await sql.query(
    `${SELECT} where a.date between $1 and $2 and ($3::text is null or a.branch = $3) order by a.date, a.time`,
    [opts.from, opts.to, opts.branch],
  )) as Appt[];
}
