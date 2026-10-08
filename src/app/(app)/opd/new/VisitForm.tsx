"use client";

import { submitWith } from "@/components/submit";
import { useActionState } from "react";
import { addVisit } from "@/lib/actions/records";
import { PatientPicker } from "@/components/PatientPicker";
import { BranchField } from "@/components/BranchField";
import { VISIT_TYPES } from "@/lib/format";

export function VisitForm({
  today,
  branches,
  defaultBranch,
  patient,
}: {
  today: string;
  branches: string[];
  defaultBranch: string;
  patient?: Parameters<typeof PatientPicker>[0]["initial"];
}) {
  const [error, action, pending] = useActionState(addVisit, null);
  return (
    <form onSubmit={submitWith(action)} className="space-y-5">
      <PatientPicker initial={patient} />
      <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BranchField branches={branches} defaultValue={defaultBranch} />
        <label className="label">
          Date
          <input name="date" type="date" defaultValue={today} className="input mt-1" />
        </label>
        <label className="label">
          Visit type
          <select name="visit_type" className="input mt-1">
            {VISIT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Procedure
          <input name="procedure" className="input mt-1" />
        </label>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="btn-gold px-6 py-3">
        {pending ? "Saving…" : "Save visit"}
      </button>
    </form>
  );
}
