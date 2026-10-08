"use client";

import { useEffect, useState } from "react";

type P = {
  mr: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string;
  branch: string;
};

/**
 * Phone-first patient lookup. Emits form fields:
 *  patient_mr (existing) or patient_name/patient_phone (new), plus patient_age/gender/address.
 */
export function PatientPicker({ initial, askDetails = true }: { initial?: P | null; askDetails?: boolean }) {
  const [q, setQ] = useState(initial?.phone ?? "");
  const [found, setFound] = useState<P[] | null>(null);
  const [selected, setSelected] = useState<P | null>(initial ?? null);

  const term = q.trim();
  const longEnough = term.replace(/\D/g, "").length >= 4 || term.replace(/[^a-z]/gi, "").length >= 2;

  useEffect(() => {
    if (selected || !longEnough) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        if (res.ok) setFound(await res.json());
      } catch {}
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [term, longEnough, selected]);

  const searched = longEnough && found !== null;
  const results = searched ? found : [];
  const isNew = !selected && searched;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      {selected ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">Existing patient</div>
            <div className="text-lg font-bold text-navy">{selected.name}</div>
            <div className="text-sm text-slate-600">
              {selected.mr} • {selected.phone || "No phone"} • {selected.branch}
            </div>
            <input type="hidden" name="patient_mr" value={selected.mr} />
          </div>
          {!initial && (
            <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>
              Change
            </button>
          )}
        </div>
      ) : (
        <>
          <label className="label">
            Patient phone number <span className="text-slate-400">(or name / MR)</span>
            <input
              className="input mt-1 text-base"
              placeholder="03xx xxxxxxx"
              inputMode="tel"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          {results.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-xs font-semibold text-slate-500">Matching patients — tap to select</div>
              <div className="flex flex-wrap gap-2">
                {results.map((p) => (
                  <button
                    type="button"
                    key={p.mr}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-navy"
                  >
                    <b>{p.name}</b>
                    <div className="text-xs text-slate-500">
                      {p.mr} • {p.phone}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {isNew && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 text-sm font-semibold text-amber-800">
                {results.length ? "Or register a new patient:" : "No patient found — register a new patient:"}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="label">
                  Patient name *
                  <input name="patient_name" className="input mt-1" required={!results.length} />
                </label>
                {/\d{4}/.test(q) ? (
                  <div className="label">
                    Phone
                    <div className="input mt-1 bg-slate-100">{q}</div>
                    <input type="hidden" name="patient_phone" value={q.trim()} />
                  </div>
                ) : (
                  <label className="label">
                    Phone
                    <input name="patient_phone" className="input mt-1" inputMode="tel" />
                  </label>
                )}
              </div>
              <p className="mt-2 text-xs text-amber-700">A new MR number is generated automatically on save.</p>
            </div>
          )}
        </>
      )}

      {askDetails && (selected || isNew) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="label">
            Age
            <input
              name="patient_age"
              type="number"
              min={0}
              max={120}
              className="input mt-1"
              defaultValue={selected?.age ?? ""}
              key={"age" + (selected?.mr ?? "new")}
            />
          </label>
          <label className="label">
            Gender
            <select
              name="patient_gender"
              className="input mt-1"
              defaultValue={selected?.gender ?? ""}
              key={"g" + (selected?.mr ?? "new")}
            >
              <option value="">—</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label className="label">
            Address
            <input
              name="patient_address"
              className="input mt-1"
              defaultValue={selected?.address ?? ""}
              key={"ad" + (selected?.mr ?? "new")}
            />
          </label>
        </div>
      )}
    </div>
  );
}
