import { PageHeader } from "@/components/Shell";
import { requireUser } from "@/lib/session";
import { baseUrl } from "@/lib/url";
import { PasswordForm } from "./PasswordForm";

export default async function AccountPage() {
  const user = await requireUser();
  const feed = `${await baseUrl()}/api/calendar/${user.calendar_token}.ics`;
  const webcal = feed.replace(/^https?:/, "webcal:");
  return (
    <>
      <PageHeader title="My Account" sub={`${user.full_name} • ${user.username} • ${user.role}${user.branch ? ` (${user.branch})` : ""}`} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-navy">Change password</h2>
          <PasswordForm />
        </div>
        <div className="card space-y-3 text-sm">
          <h2 className="font-semibold text-navy">Clinic appointments in your own calendar</h2>
          <p className="text-slate-600">
            Subscribe once and every appointment{user.branch ? ` for ${user.branch}` : ""} appears in your phone&apos;s calendar and
            stays up to date.
          </p>
          <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs break-all">{feed}</div>
          <div className="flex flex-wrap gap-2">
            <a href={webcal} className="btn-primary">Subscribe on iPhone / Mac</a>
            <a
              href={`https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(webcal)}`}
              target="_blank"
              rel="noopener"
              className="btn-ghost"
            >
              Add to Google Calendar
            </a>
          </div>
          <p className="text-xs text-slate-500">
            Keep this link private — anyone with it can see appointment names and times. Google Calendar refreshes subscribed
            calendars every few hours; Apple Calendar can refresh every 5–15 minutes. The link only works once the app is online
            (deployed), not on localhost.
          </p>
        </div>
      </div>
    </>
  );
}
