import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentCard } from "@/components/AppointmentCard";
import { updateAppointment } from "@/lib/actions/appointments";
import { bookedBy, getAppt } from "@/lib/appointments";
import { sql } from "@/lib/db";
import { googleCalendarUrl, weekdayOf } from "@/lib/calendar";
import { APPT_STATUSES, prettyDate, prettyTime, waLink } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { baseUrl } from "@/lib/url";

export default async function AppointmentPage({ params, searchParams }: PageProps<"/appointments/[id]">) {
  const user = await requireUser();
  const a = await getAppt({ id: Number((await params).id) });
  if (!a || (user.branch && user.branch !== a.branch)) notFound();
  // Opening a website booking takes it off everyone's "new" list.
  if (a.source === "website" && !a.seen_at) await sql`update appointments set seen_at = now() where id = ${a.id}`;
  const created = (await searchParams).created === "1";
  const isAdmin = user.role === "admin";
  const link = `${await baseUrl()}/a/${a.share_token}`;

  const when = `${weekdayOf(a.date)}, ${prettyDate(a.date)} at ${prettyTime(a.time)}`;
  const confirmMsg =
    `Dear ${a.patient_name}, your appointment at Umar Dental & Implant Center is confirmed.\n\n` +
    `📅 ${when}\n` +
    (a.procedure ? `🦷 ${a.procedure}\n` : "") +
    `📍 ${a.branch_name}: ${a.branch_address}\n\n` +
    `Tap to save it to your calendar:\n${link}\n\nPlease arrive 10 minutes early. Thank you.`;
  const reminderMsg =
    `Dear ${a.patient_name}, a reminder of your appointment at Umar Dental & Implant Center on ${when} (${a.branch_name}).\n` +
    `Details: ${link}`;
  const waConfirm = waLink(a.patient_phone ?? "", confirmMsg);
  const waReminder = waLink(a.patient_phone ?? "", reminderMsg);

  return (
    <>
      <div className="no-print mb-5">
        <Link href={`/appointments?week=${a.date}`} className="text-sm text-slate-500 hover:text-navy">
          ← Appointments
        </Link>
        <h1 className="text-2xl font-bold text-navy">
          Appointment
          {a.source === "website" && <span className="badge ml-2 bg-gold/20 align-middle text-navy">Booked from website</span>}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Booked by <b className="text-slate-700">{bookedBy(a)}</b> on{" "}
          {new Date(a.created_at).toLocaleString("en-GB", {
            timeZone: "Asia/Karachi",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>
      {created && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <b>Appointment booked.</b> Send the confirmation to the patient so they can save it to their calendar.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <AppointmentCard a={a} />

        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-semibold text-navy">Send to patient</h2>
            {waConfirm ? (
              <>
                <a href={waConfirm} target="_blank" rel="noopener" className="btn-wa w-full py-3">
                  WhatsApp confirmation + calendar link
                </a>
                <a href={waReminder!} target="_blank" rel="noopener" className="btn-ghost w-full">
                  WhatsApp reminder
                </a>
              </>
            ) : (
              <p className="text-sm text-amber-700">This patient has no valid phone number on file.</p>
            )}
            <a href={link} target="_blank" rel="noopener" className="btn-ghost w-full">
              Open patient&apos;s calendar page
            </a>
            <p className="text-xs break-all text-slate-500">{link}</p>
          </div>

          <div className="card space-y-2">
            <h2 className="font-semibold text-navy">Add to your calendar</h2>
            <a href={googleCalendarUrl(a, true)} target="_blank" rel="noopener" className="btn-primary w-full">
              Google Calendar
            </a>
            <a href={`/a/${a.share_token}/ics`} className="btn-ghost w-full">
              Download .ics (Apple / Outlook)
            </a>
            <p className="text-xs text-slate-500">
              Tip: subscribe once from <Link href="/account" className="underline">My Account</Link> to get every appointment
              in your calendar automatically.
            </p>
          </div>

          <form action={updateAppointment} className="card space-y-3">
            <h2 className="font-semibold text-navy">{isAdmin ? "Status & reschedule" : "Status"}</h2>
            <input type="hidden" name="id" value={a.id} />
            <label className="label">
              Status
              <select name="status" defaultValue={a.status} className="input mt-1">
                {APPT_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <fieldset disabled={!isAdmin} className="grid grid-cols-2 gap-2">
              <label className="label">
                Date
                <input name="date" type="date" defaultValue={a.date} className="input mt-1 disabled:bg-slate-50 disabled:text-slate-500" />
              </label>
              <label className="label">
                Time
                <input name="time" type="time" defaultValue={a.time} className="input mt-1 disabled:bg-slate-50 disabled:text-slate-500" />
              </label>
            </fieldset>
            <button className="btn-primary w-full">Save changes</button>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? "After rescheduling, send the WhatsApp confirmation again — the link always shows the latest time."
                : "Only admin can change the date or time."}
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
