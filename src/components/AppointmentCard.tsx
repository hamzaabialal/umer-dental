import { LogoLockup } from "./Logo";
import { PhoneIcon, PinIcon } from "./docs/parts";
import { prettyDate, prettyPhone, prettyTime } from "@/lib/format";
import { weekdayOf } from "@/lib/calendar";
import type { Appt } from "@/lib/appointments";

/** The branded appointment confirmation the patient sees (also embedded in the staff view). */
export function AppointmentCard({ a, children }: { a: Appt; children?: React.ReactNode }) {
  const cancelled = a.status === "Cancelled";
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
      <div className="flex justify-center border-b border-slate-100 px-6 py-6">
        <LogoLockup size={56} />
      </div>
      <div className="bg-navy px-6 py-4 text-center text-white">
        <div className="text-xs tracking-[0.3em] text-gold">{cancelled ? "APPOINTMENT CANCELLED" : "APPOINTMENT CONFIRMATION"}</div>
        <div className="mt-1 text-lg font-semibold">{a.patient_name}</div>
        <div className="text-xs text-slate-300">MR No. {a.mr}</div>
      </div>
      <div className={`grid grid-cols-2 gap-px bg-slate-100 ${cancelled ? "opacity-50" : ""}`}>
        <div className="bg-white p-5 text-center">
          <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Date</div>
          <div className="mt-1 text-xl font-bold text-navy">{prettyDate(a.date)}</div>
          <div className="text-sm text-slate-500">{weekdayOf(a.date)}</div>
        </div>
        <div className="bg-white p-5 text-center">
          <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Time</div>
          <div className="mt-1 text-xl font-bold text-navy">{prettyTime(a.time)}</div>
          <div className="text-sm text-slate-500">{a.duration_min} min</div>
        </div>
      </div>
      <div className="space-y-3 px-6 py-5 text-sm">
        {a.procedure && (
          <div>
            <span className="text-slate-500">Procedure: </span>
            <b className="text-navy">{a.procedure}</b>
          </div>
        )}
        <div className="flex gap-2">
          <PinIcon />
          <div>
            <b className="text-navy">{a.branch_name}</b>
            <div className="text-slate-600">{a.branch_address}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PhoneIcon />
          <a href={`tel:${a.branch_phone}`} className="text-slate-700">
            {prettyPhone(a.branch_phone)}
          </a>
        </div>
        {!cancelled && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Please arrive 10 minutes early.</p>}
      </div>
      {children && <div className="border-t border-slate-100 px-6 py-5">{children}</div>}
    </div>
  );
}
