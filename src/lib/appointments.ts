import "server-only";
import { sql } from "./db";
import type { CalAppt } from "./calendar";

export type Appt = CalAppt & {
  share_token: string;
  mr: string;
  branch: string;
  source: string;
  seen_at: string | null;
  created_at: string;
  created_by_name: string | null;
};

const SELECT = `
  select a.id, a.share_token, a.mr, a.branch, a.date, a.time, a.duration_min, a.procedure, a.status, a.notes, a.source, a.seen_at, a.created_at,
         u.full_name as created_by_name,
         p.name as patient_name, p.phone as patient_phone,
         b.name as branch_name, b.address as branch_address, b.phone as branch_phone
  from appointments a
  join patients p on p.mr = a.mr
  join branches b on b.code = a.branch
  left join users u on u.id = a.created_by`;

/** Who made the booking: "Website", the staff member's name, or "Unknown" for records without one. */
export function bookedBy(a: Pick<Appt, "source" | "created_by_name">): string {
  return a.source === "website" ? "Website" : (a.created_by_name ?? "Unknown");
}

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

export type NewBooking = {
  id: number;
  patient_name: string;
  branch: string;
  date: string;
  time: string;
  procedure: string;
  created_at: string;
};

/** Website bookings no staff member has opened yet. branch null = all branches. */
export async function listNewBookings(branch: string | null): Promise<{ count: number; items: NewBooking[] }> {
  const items = (await sql`
    select a.id, p.name as patient_name, a.branch, a.date, a.time, a.procedure, a.created_at
    from appointments a join patients p on p.mr = a.mr
    where a.source = 'website' and a.seen_at is null and a.status <> 'Cancelled'
      and (${branch}::text is null or a.branch = ${branch})
    order by a.created_at desc
    limit 50`) as NewBooking[];
  return { count: items.length, items };
}
