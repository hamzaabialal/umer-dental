// Shared helpers that are safe on both server and client.

export const BRANCHES = ["Bahria", "PWD"] as const;
export type Branch = (typeof BRANCHES)[number];

export const VISIT_TYPES = ["Consultation", "Follow-up", "Treatment", "Post-op", "Trial", "Adjustment", "Emergency"];
export const APPT_STATUSES = ["Booked", "Confirmed", "Arrived", "Completed", "Cancelled", "No-show"] as const;
export const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Other"] as const;

/** Clinic-local "today" (Asia/Karachi), as YYYY-MM-DD. */
export function todayPK(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}

export function rs(n: number | string | null | undefined): string {
  return Number(n || 0).toLocaleString("en-PK");
}

export function pkr(n: number | string | null | undefined): string {
  return "Rs. " + rs(n);
}

/** "2024-10-15" -> "15 Oct 2024" */
export function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return `${d} ${mon} ${y}`;
}

/** "16:30" -> "4:30 PM" */
export function prettyTime(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  if (Number.isNaN(h)) return hm;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Normalises Pakistani numbers to 92XXXXXXXXXX digits; returns "" for empty / NIL. */
export function normPhone(v: string | null | undefined): string {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(2);
  else if (d.startsWith("03")) d = "92" + d.slice(1);
  else if (d.length === 10 && d.startsWith("3")) d = "92" + d;
  return d;
}

/** "03310009851" -> "+92 331 000 9851" (leaves anything unrecognised as typed). */
export function prettyPhone(v: string): string {
  const n = normPhone(v);
  return n.length === 12 && n.startsWith("92") ? `+92 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}` : v;
}

export function waLink(phone: string, message: string): string | null {
  const n = normPhone(phone);
  if (n.length < 11) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function lines(text: string | null | undefined): string[] {
  return String(text ?? "")
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
}
