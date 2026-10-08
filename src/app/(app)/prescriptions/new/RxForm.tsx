"use client";

import { submitWith } from "@/components/submit";
import { useActionState, useState } from "react";
import { createPrescription } from "@/lib/actions/prescriptions";
import { PatientPicker } from "@/components/PatientPicker";
import { BranchField } from "@/components/BranchField";

type Med = { medicine: string; dose: string; instructions: string; days: string };

// Common dental prescriptions: picking a medicine fills in its usual dose / instructions / days.
const COMMON: Med[] = [
  { medicine: "Tab. Ibuprofen 400 mg", dose: "1 tablet", instructions: "After meals, if needed for pain", days: "3 days" },
  { medicine: "Tab. Paracetamol 500 mg", dose: "2 tablets", instructions: "Three times daily, if needed for pain", days: "3 days" },
  { medicine: "Tab. Amoxicillin 500 mg", dose: "1 capsule", instructions: "Twice daily after meals", days: "5 days" },
  { medicine: "Tab. Co-Amoxiclav 625 mg", dose: "1 tablet", instructions: "Twice daily after meals", days: "5 days" },
  { medicine: "Tab. Metronidazole 400 mg", dose: "1 tablet", instructions: "Twice daily after meals", days: "5 days" },
  { medicine: "Tab. Diclofenac 50 mg", dose: "1 tablet", instructions: "Twice daily after meals", days: "3 days" },
  { medicine: "Cap. Omeprazole 20 mg", dose: "1 capsule", instructions: "Once daily before breakfast", days: "5 days" },
  { medicine: "Mouthwash (Chlorhexidine 0.12%)", dose: "10 ml", instructions: "Rinse twice daily", days: "7 days" },
  { medicine: "Sensodyne Toothpaste", dose: "—", instructions: "Brush twice daily", days: "30 days" },
];

const DEFAULT_ADVICE = `Take medicines as prescribed.
Avoid very hot or cold food.
Maintain good oral hygiene.
Follow up after 1 week or if pain persists.`;

const empty = (): Med => ({ medicine: "", dose: "", instructions: "", days: "" });

export function RxForm({
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
  const [error, action, pending] = useActionState(createPrescription, null);
  const [meds, setMeds] = useState<Med[]>([empty()]);
  const update = (i: number, patch: Partial<Med>) => setMeds((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <form onSubmit={submitWith(action)} className="space-y-5">
      <PatientPicker initial={patient} />
      <div className="grid gap-3 sm:grid-cols-3">
        <BranchField branches={branches} defaultValue={defaultBranch} />
        <label className="label">
          Date
          <input name="date" type="date" defaultValue={today} className="input mt-1" required />
        </label>
      </div>

      <div className="card grid gap-4 lg:grid-cols-2">
        <label className="label">
          Diagnosis / clinical notes
          <textarea name="diagnosis" rows={3} className="input mt-1" placeholder="Mild sensitivity in lower right molar…" />
        </label>
        <label className="label">
          Treatment done today <span className="text-slate-400">(one per line)</span>
          <textarea name="treatment_done" rows={3} className="input mt-1" placeholder={"Root Canal Treatment – #46 (Completed)\nTemporary Filling"} />
        </label>
      </div>

      <div className="card overflow-x-auto p-0">
        <datalist id="med-list">
          {COMMON.map((m) => (
            <option key={m.medicine} value={m.medicine} />
          ))}
        </datalist>
        <table className="table min-w-[680px]">
          <thead>
            <tr>
              <th>Medicine</th>
              <th className="w-32">Dose</th>
              <th>Instructions</th>
              <th className="w-28">Days</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {meds.map((m, i) => (
              <tr key={i}>
                <td>
                  <input
                    list="med-list"
                    className="input"
                    value={m.medicine}
                    placeholder="Type or pick"
                    onChange={(e) => {
                      const preset = COMMON.find((c) => c.medicine === e.target.value);
                      update(i, preset ?? { medicine: e.target.value });
                    }}
                  />
                </td>
                <td>
                  <input className="input" value={m.dose} onChange={(e) => update(i, { dose: e.target.value })} />
                </td>
                <td>
                  <input className="input" value={m.instructions} onChange={(e) => update(i, { instructions: e.target.value })} />
                </td>
                <td>
                  <input className="input" value={m.days} onChange={(e) => update(i, { days: e.target.value })} />
                </td>
                <td>
                  <button type="button" className="btn-danger px-2.5" onClick={() => setMeds((ms) => ms.filter((_, j) => j !== i))} aria-label="Remove">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-100 p-3">
          <button type="button" className="btn-ghost" onClick={() => setMeds((ms) => [...ms, empty()])}>
            + Add medicine
          </button>
        </div>
      </div>
      <input type="hidden" name="items" value={JSON.stringify(meds)} />

      <div className="card">
        <label className="label">
          Advice / instructions <span className="text-slate-400">(one per line)</span>
          <textarea name="advice" rows={4} className="input mt-1" defaultValue={DEFAULT_ADVICE} />
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="btn-gold px-6 py-3 text-base">
        {pending ? "Saving…" : "Save & generate prescription"}
      </button>
    </form>
  );
}
