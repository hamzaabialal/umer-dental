"use client";

import { submitWith } from "@/components/submit";
import { useActionState } from "react";
import { createAppointment } from "@/lib/actions/appointments";
import { PatientPicker } from "@/components/PatientPicker";
import { BranchField } from "@/components/BranchField";

export function AppointmentForm({
  today,
  branches,
  defaultBranch,
  procedures,
  patient,
  date,
}: {
  today: string;
  branches: string[];
  defaultBranch: string;
  procedures: string[];
  patient?: Parameters<typeof PatientPicker>[0]["initial"];
  date?: string;
}) {
  const [error, action, pending] = useActionState(createAppointment, null);
  return (
    <form onSubmit={submitWith(action)} className="space-y-5">
      <PatientPicker initial={patient} askDetails={false} />
      <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BranchField branches={branches} defaultValue={defaultBranch} />
        <label className="label">
          Date
          <input name="date" type="date" min={today} defaultValue={date ?? today} className="input mt-1" required />
        </label>
        <label className="label">
          Time
          <input name="time" type="time" defaultValue="16:00" step={300} className="input mt-1" required />
        </label>
        <label className="label">
          Duration
          <select name="duration_min" defaultValue="30" className="input mt-1">
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </label>
        <label className="label sm:col-span-2">
          Procedure
          <input name="procedure" list="proc-list" className="input mt-1" placeholder="e.g. Root Canal Treatment" />
          <datalist id="proc-list">
            {procedures.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label className="label sm:col-span-2">
          Notes
          <input name="notes" className="input mt-1" />
        </label>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="btn-gold px-6 py-3 text-base">
        {pending ? "Booking…" : "Book & generate appointment"}
      </button>
    </form>
  );
}
