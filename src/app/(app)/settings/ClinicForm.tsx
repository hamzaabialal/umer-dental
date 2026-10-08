"use client";

import { submitWith } from "@/components/submit";
import { useActionState } from "react";
import { saveClinicSettings } from "@/lib/actions/settings";
import type { BranchInfo, Settings } from "@/lib/data";

const F = ({ name, label, value, span }: { name: string; label: string; value: string; span?: boolean }) => (
  <label className={`label ${span ? "sm:col-span-2" : ""}`}>
    {label}
    <input name={name} defaultValue={value} className="input mt-1" />
  </label>
);

export function ClinicForm({ settings: s, branches }: { settings: Settings; branches: BranchInfo[] }) {
  const [msg, action, pending] = useActionState(saveClinicSettings, null);
  return (
    <form onSubmit={submitWith(action)} className="space-y-5">
      <div className="card">
        <h2 className="mb-1 font-semibold text-navy">Clinic & doctor</h2>
        <p className="mb-4 text-xs text-slate-500">Printed on every invoice, prescription and appointment card.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <F name="clinic_name" label="Clinic name" value={s.clinic_name} />
          <F name="clinic_subtitle" label="Subtitle" value={s.clinic_subtitle} />
          <F name="tagline" label="Tagline" value={s.tagline} span />
          <F name="doctor_name" label="Doctor name (signature)" value={s.doctor_name} />
          <F name="doctor_qualification" label="Qualifications" value={s.doctor_qualification} />
          <F name="email" label="Email (optional)" value={s.email} />
          <F name="website" label="Website (optional)" value={s.website} />
          <F name="whatsapp_number" label="WhatsApp number (prescription QR)" value={s.whatsapp_number} />
          <F name="secondary_phone" label="Secondary phone" value={s.secondary_phone} />
          <F name="hours" label="Clinic hours (footer, if no website)" value={s.hours} />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="label">
            Signature image (PNG with transparent background works best, max 300 KB)
            <input name="signature" type="file" accept="image/png,image/jpeg,image/webp" className="input mt-1" />
          </label>
          {s.signature_data_url && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.signature_data_url} alt="Current signature" className="h-12 rounded border border-slate-200 bg-white p-1" />
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" name="remove_signature" value="1" /> Remove
              </label>
            </div>
          )}
        </div>
      </div>

      {branches.map((b) => (
        <div key={b.code} className="card">
          <h2 className="mb-4 font-semibold text-navy">{b.code} branch</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F name={`${b.code}_name`} label="Heading (e.g. BAHRIA BRANCH)" value={b.name} />
            <F name={`${b.code}_phone`} label="Phone" value={b.phone} />
            <F name={`${b.code}_address`} label="Address" value={b.address} span />
            <F name={`${b.code}_review_url`} label="Google review link (invoice QR)" value={b.review_url} span />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-gold px-6">{pending ? "Saving…" : "Save settings"}</button>
        {msg === "ok" && <span className="text-sm text-emerald-700">Saved.</span>}
        {msg && msg !== "ok" && <span className="text-sm text-red-700">{msg}</span>}
      </div>
    </form>
  );
}
