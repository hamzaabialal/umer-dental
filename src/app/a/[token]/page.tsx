import { notFound } from "next/navigation";
import { AppointmentCard } from "@/components/AppointmentCard";
import { getAppt } from "@/lib/appointments";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar";

export const metadata = { title: "Your appointment — Umar Dental & Implant Center", robots: { index: false } };

/** Public page sent to the patient on WhatsApp: shows the appointment and adds it to their calendar. */
export default async function PublicAppointment({ params }: PageProps<"/a/[token]">) {
  const { token } = await params;
  const a = await getAppt({ token });
  if (!a) notFound();
  const cancelled = a.status === "Cancelled";
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e8f0fa] to-[#f4f7fb] px-4 py-8">
      <AppointmentCard a={a}>
        {!cancelled && (
          <>
            <div className="mb-3 text-center text-sm font-semibold text-navy">Save to your calendar</div>
            <div className="grid gap-2">
              <a href={googleCalendarUrl(a)} target="_blank" rel="noopener" className="btn-primary py-3">
                Add to Google Calendar
              </a>
              <a href={`/a/${token}/ics`} className="btn-ghost py-3">
                Add to Apple Calendar / iPhone
              </a>
              <a href={outlookCalendarUrl(a)} target="_blank" rel="noopener" className="btn-ghost py-3">
                Add to Outlook
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.branch_address)}`}
                target="_blank"
                rel="noopener"
                className="btn-ghost py-3"
              >
                Get directions
              </a>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">
              The calendar entry includes reminders 1 day and 2 hours before.
            </p>
          </>
        )}
      </AppointmentCard>
    </main>
  );
}
