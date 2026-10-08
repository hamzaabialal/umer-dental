// Calendar helpers: .ics (Apple / Outlook / any calendar app), Google and Outlook web "add event" links.
// Clinic times are Asia/Karachi (UTC+5, no daylight saving), so converting to UTC is a fixed offset.

export type CalAppt = {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_min: number;
  procedure: string;
  status: string;
  notes?: string;
  patient_name: string;
  patient_phone?: string;
  branch_name: string;
  branch_address: string;
  branch_phone: string;
};

const PKT_OFFSET_H = 5;

function utcStart(a: Pick<CalAppt, "date" | "time">): Date {
  const [y, m, d] = a.date.split("-").map(Number);
  const [h, min] = a.time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h - PKT_OFFSET_H, min || 0));
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // 20241015T110000Z

export function apptTimes(a: CalAppt) {
  const start = utcStart(a);
  const end = new Date(start.getTime() + (a.duration_min || 30) * 60000);
  return { start, end };
}

export function weekdayOf(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

function title(a: CalAppt, forStaff: boolean) {
  return forStaff
    ? `${a.patient_name}${a.procedure ? ` – ${a.procedure}` : ""} (${a.branch_name})`
    : `Dental appointment – Umar Dental & Implant Center`;
}

function details(a: CalAppt, forStaff: boolean) {
  return [
    a.procedure && `Procedure: ${a.procedure}`,
    forStaff && a.patient_phone && `Patient phone: ${a.patient_phone}`,
    `Branch: ${a.branch_name}`,
    `Clinic phone: ${a.branch_phone}`,
    !forStaff && "Please arrive 10 minutes early.",
    a.notes && `Notes: ${a.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function googleCalendarUrl(a: CalAppt, forStaff = false): string {
  const { start, end } = apptTimes(a);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title(a, forStaff),
    dates: `${stamp(start)}/${stamp(end)}`,
    details: details(a, forStaff),
    location: a.branch_address,
    ctz: "Asia/Karachi",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function outlookCalendarUrl(a: CalAppt): string {
  const { start, end } = apptTimes(a);
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title(a, false),
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: details(a, false),
    location: a.branch_address,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 line folding at 75 octets. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (len + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      len = 0;
    }
    cur += ch;
    len += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

function vevent(a: CalAppt, forStaff: boolean): string[] {
  const { start, end } = apptTimes(a);
  const lines = [
    "BEGIN:VEVENT",
    `UID:appt-${a.id}@umardental`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title(a, forStaff))}`,
    `DESCRIPTION:${esc(details(a, forStaff))}`,
    `LOCATION:${esc(a.branch_address)}`,
    `STATUS:${a.status === "Cancelled" ? "CANCELLED" : "CONFIRMED"}`,
  ];
  if (!forStaff && a.status !== "Cancelled") {
    lines.push(
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Dental appointment tomorrow", "TRIGGER:-P1D", "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Dental appointment in 2 hours", "TRIGGER:-PT2H", "END:VALARM",
    );
  }
  lines.push("END:VEVENT");
  return lines;
}

export function buildIcs(appts: CalAppt[], { forStaff = false, name }: { forStaff?: boolean; name?: string } = {}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Umar Dental & Implant Center//Clinic System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(name ? [`X-WR-CALNAME:${esc(name)}`, "X-WR-TIMEZONE:Asia/Karachi", "REFRESH-INTERVAL;VALUE=DURATION:PT1H"] : []),
    ...appts.flatMap((a) => vevent(a, forStaff)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
