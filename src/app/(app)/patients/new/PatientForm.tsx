"use client";

import { submitWith } from "@/components/submit";
import { useActionState } from "react";
import { addPatient } from "@/lib/actions/records";
import { BranchField } from "@/components/BranchField";

export function PatientForm({ branches, defaultBranch, today }: { branches: string[]; defaultBranch: string; today: string }) {
  const [msg, action, pending] = useActionState(addPatient, null);
  const dup = msg?.startsWith("DUP:");
  return (
    <form onSubmit={submitWith(action)} className="card grid max-w-3xl gap-4 sm:grid-cols-2">
      <label className="label">
        Phone / WhatsApp
        <input name="phone" inputMode="tel" placeholder="03xx xxxxxxx" className="input mt-1" autoFocus />
      </label>
      <label className="label">
        Full name *
        <input name="name" required className="input mt-1" />
      </label>
      <label className="label">
        Age
        <input name="age" type="number" min={0} max={120} className="input mt-1" />
      </label>
      <label className="label">
        Gender
        <select name="gender" className="input mt-1" defaultValue="">
          <option value="">—</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </label>
      <label className="label sm:col-span-2">
        Address
        <input name="address" className="input mt-1" />
      </label>
      <BranchField branches={branches} defaultValue={defaultBranch} />
      <label className="label">
        First visit
        <input name="first_visit" type="date" defaultValue={today} className="input mt-1" />
      </label>
      {dup && <input type="hidden" name="confirm_dup" value="1" />}
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm sm:col-span-2 ${dup ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}>
          {dup ? msg.slice(4) : msg}
        </p>
      )}
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn-gold px-6 py-3">
          {pending ? "Saving…" : dup ? "Save anyway" : "Save patient"}
        </button>
        <span className="ml-3 text-xs text-slate-500">MR number is generated automatically.</span>
      </div>
    </form>
  );
}
