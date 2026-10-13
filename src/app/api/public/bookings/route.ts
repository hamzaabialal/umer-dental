import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { weekdayOf } from "@/lib/calendar";
import { createPatient, type Patient } from "@/lib/data";
import { sql } from "@/lib/db";
import { BRANCHES, normPhone, prettyDate, prettyPhone, prettyTime, todayPK, waLink } from "@/lib/format";
import { notifyClinic } from "@/lib/notify";
import { baseUrl } from "@/lib/url";

/**
 * Public booking endpoint for the clinic website's appointment form.
 *
 * Accepts JSON or form data: name, phone, branch (Bahria | PWD), date (YYYY-MM-DD), time (HH:MM),
 * optional treatment and message, plus an always-empty honeypot field "company".
 * Callers must come from an origin in BOOKING_ALLOWED_ORIGINS (browser) or send X-Api-Key = BOOKING_API_KEY (server).
 * Creates the patient if new, books a 'website' appointment and WhatsApps the clinic.
 */

const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_PHONE_PER_DAY = 3;
const MAX_DAYS_AHEAD = 90;

function allowedOrigins(): string[] {
  return (process.env.BOOKING_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  const raw: Record<string, unknown> = type.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  return Object.fromEntries(Object.entries(raw ?? {}).map(([k, v]) => [k, typeof v === "string" ? v.trim() : ""]));
}

function addDays(ymd: string, n: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function nowTimePK(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(),
  );
}

/** Returns an error message for the patient, or the cleaned booking. */
function validate(b: Record<string, string>) {
  const name = (b.name ?? "").replace(/\s+/g, " ");
  const phone = b.phone ?? "";
  const phoneNorm = normPhone(phone);
  const branch = BRANCHES.find((x) => x.toLowerCase() === (b.branch ?? "").toLowerCase());
  const date = b.date ?? "";
  const time = b.time ?? "";
  const treatment = (b.treatment ?? "").slice(0, 100);
  const message = (b.message ?? "").slice(0, 500);
  const today = todayPK();

  if (name.length < 2 || name.length > 80) return { error: "Please enter your full name." };
  if (phoneNorm.length < 11 || phoneNorm.length > 15) return { error: "Please enter a valid mobile number." };
  if (!branch) return { error: `Please choose a branch (${BRANCHES.join(" or ")}).` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || addDays(date, 0) !== date) return { error: "Please choose a valid date." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: "Please choose a valid time." };
  if (date < today || (date === today && time <= nowTimePK())) return { error: "Please choose a time in the future." };
  if (date > addDays(today, MAX_DAYS_AHEAD)) return { error: `Bookings open up to ${MAX_DAYS_AHEAD} days ahead.` };

  return { booking: { name, phone, phoneNorm, branch, date, time, treatment, message } };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const reply = (status: number, body: object) => Response.json(body, { status, headers });

  const apiKey = process.env.BOOKING_API_KEY;
  const keyOk = !!apiKey && request.headers.get("x-api-key") === apiKey;
  const originOk = !!origin && allowedOrigins().includes(origin);
  if (!keyOk && !originOk) return reply(403, { ok: false, error: "This site is not allowed to book appointments." });

  let body: Record<string, string>;
  try {
    body = await readBody(request);
  } catch {
    return reply(400, { ok: false, error: "Invalid request." });
  }

  // Bots fill every field; people never see this one. Pretend it worked so they don't retry.
  if (body.company) return reply(200, { ok: true });

  const v = validate(body);
  if (!v.booking) return reply(422, { ok: false, error: v.error });
  const b = v.booking;

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const [limits] = await sql`
    select count(*) filter (where ip = ${ip} and ${ip} <> '' and created_at > now() - interval '1 hour')::int as by_ip,
           count(*) filter (where phone_norm = ${b.phoneNorm})::int as by_phone
    from web_booking_log where created_at > now() - interval '1 day'`;
  if (limits.by_ip >= MAX_PER_IP_PER_HOUR || limits.by_phone >= MAX_PER_PHONE_PER_DAY) {
    return reply(429, { ok: false, error: "Too many booking requests. Please call or WhatsApp us instead." });
  }

  // Same phone + same name is the same patient; anyone else sharing a family phone gets their own record.
  const [existing] = await sql`
    select * from patients where phone_norm = ${b.phoneNorm} and lower(name) = lower(${b.name})
    order by first_visit limit 1`;
  const patient =
    (existing as Patient | undefined) ??
    (await createPatient({ name: b.name, phone: b.phone, age: null, gender: null, address: "", branch: b.branch, first_visit: b.date }));

  // A double-submitted form returns the booking it already made instead of creating a second one.
  const [dupe] = await sql`
    select id, share_token from appointments
    where mr = ${patient.mr} and date = ${b.date} and time = ${b.time} and status <> 'Cancelled'`;
  const [appt] = dupe
    ? [dupe]
    : await sql`
        insert into appointments (mr, branch, date, time, duration_min, procedure, status, notes, source)
        values (${patient.mr}, ${b.branch}, ${b.date}, ${b.time}, 30, ${b.treatment}, 'Booked', ${b.message}, 'website')
        returning id, share_token`;

  const base = await baseUrl();
  if (!dupe) {
    await sql`insert into web_booking_log (ip, phone_norm) values (${ip}, ${b.phoneNorm})`;
    revalidatePath("/appointments");

    const when = `${weekdayOf(b.date)}, ${prettyDate(b.date)} at ${prettyTime(b.time)}`;
    const staffLink = `${base}/appointments/${appt.id}`;
    const text =
      `🦷 *New website booking*\n\n` +
      `👤 ${b.name} (${patient.mr}${existing ? "" : ", new patient"})\n` +
      `📞 ${prettyPhone(b.phone)}\n` +
      `📍 ${b.branch} branch\n` +
      `📅 ${when}\n` +
      (b.treatment ? `🩺 ${b.treatment}\n` : "") +
      (b.message ? `💬 ${b.message}\n` : "") +
      `\nOpen: ${staffLink}\n` +
      `Reply to patient: ${waLink(b.phone, `Hello ${b.name}, `) ?? "-"}`;
    after(() =>
      notifyClinic(text, [b.name, prettyPhone(b.phone), b.branch, when, b.treatment || "-", b.message || "-", staffLink]),
    );
  }

  return reply(dupe ? 200 : 201, {
    ok: true,
    appointment: { id: appt.id, branch: b.branch, date: b.date, time: b.time },
    calendarUrl: `${base}/a/${appt.share_token}`,
  });
}
