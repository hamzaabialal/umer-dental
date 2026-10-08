"use client";

import { submitWith } from "@/components/submit";
import { useActionState, useState } from "react";
import { createInvoice } from "@/lib/actions/invoices";
import { PatientPicker } from "@/components/PatientPicker";
import { BranchField } from "@/components/BranchField";
import { PAYMENT_METHODS, rs } from "@/lib/format";

type Rate = { name: string; price: number };
type Row = { procedure: string; tooth: string; qty: number; rate: number };

export function InvoiceForm({
  rates,
  today,
  branches,
  defaultBranch,
  patient,
}: {
  rates: Rate[];
  today: string;
  branches: string[];
  defaultBranch: string;
  patient?: Parameters<typeof PatientPicker>[0]["initial"];
}) {
  const [error, action, pending] = useActionState(createInvoice, null);
  const [rows, setRows] = useState<Row[]>([{ procedure: "Consultation", tooth: "", qty: 1, rate: priceOf("Consultation") }]);
  const [discount, setDiscount] = useState(0);
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);

  function priceOf(name: string) {
    return rates.find((r) => r.name.toLowerCase() === name.toLowerCase())?.price ?? 0;
  }
  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const total = rows.reduce((a, r) => a + (r.procedure ? r.qty * r.rate : 0), 0);
  const net = Math.max(0, total - discount);
  const pendingAmt = Math.max(0, net - cash - card);

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

      <div className="card overflow-x-auto p-0">
        <datalist id="rate-list">
          {rates.map((r) => (
            <option key={r.name} value={r.name} />
          ))}
        </datalist>
        <table className="table min-w-[640px]">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Procedure / Service</th>
              <th className="w-28">Tooth / Area</th>
              <th className="w-20">Qty</th>
              <th className="w-32">Rate (Rs.)</th>
              <th className="w-28 text-right">Amount</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="pt-4 text-slate-400">{i + 1}</td>
                <td>
                  <input
                    list="rate-list"
                    className="input"
                    value={r.procedure}
                    placeholder="Type or pick a procedure"
                    onChange={(e) => {
                      const v = e.target.value;
                      const p = priceOf(v);
                      update(i, p ? { procedure: v, rate: p } : { procedure: v });
                    }}
                  />
                </td>
                <td>
                  <input className="input" value={r.tooth} placeholder="#46" onChange={(e) => update(i, { tooth: e.target.value })} />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={r.qty}
                    onChange={(e) => update(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={r.rate}
                    onChange={(e) => update(i, { rate: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </td>
                <td className="pt-4 text-right font-semibold">{rs(r.qty * r.rate)}</td>
                <td>
                  <button
                    type="button"
                    className="btn-danger px-2.5"
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                    aria-label="Remove line"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setRows((rs) => [...rs, { procedure: "", tooth: "", qty: 1, rate: 0 }])}
          >
            + Add procedure
          </button>
        </div>
      </div>
      <input type="hidden" name="items" value={JSON.stringify(rows)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card space-y-4">
          <div>
            <div className="label mb-2">Payment method</div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-navy has-[:checked]:bg-navy/5">
                  <input type="radio" name="payment_method" value={m} defaultChecked={m === "Cash"} />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="label">
              Amount paid (Cash)
              <input name="paid_cash" type="number" min={0} className="input mt-1" value={cash} onChange={(e) => setCash(Number(e.target.value) || 0)} />
            </label>
            <label className="label">
              Amount paid (Card / Online)
              <input name="paid_card" type="number" min={0} className="input mt-1" value={card} onChange={(e) => setCard(Number(e.target.value) || 0)} />
            </label>
          </div>
          <label className="label">
            Remarks
            <input name="remarks" className="input mt-1" placeholder="e.g. RCT completed. Patient to return for crown." />
          </label>
        </div>

        <div className="card">
          <dl className="space-y-2 text-sm">
            <Line label="Total charges" value={rs(total)} />
            <div className="flex items-center justify-between">
              <dt>Discount / Adjustment</dt>
              <input
                name="discount"
                type="number"
                min={0}
                className="input w-32 text-right"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <Line label="Net amount" value={rs(net)} strong className="rounded-lg bg-blue-50 px-2 py-1.5" />
            <Line label="Total paid" value={rs(cash + card)} />
            <Line
              label="Pending amount"
              value={rs(pendingAmt)}
              strong
              className={`rounded-lg px-2 py-1.5 ${pendingAmt ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}
            />
          </dl>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-ghost text-xs" onClick={() => { setCash(net); setCard(0); }}>
              Paid in full (cash)
            </button>
            <button type="button" className="btn-ghost text-xs" onClick={() => { setCard(net); setCash(0); }}>
              Paid in full (card)
            </button>
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="btn-gold px-6 py-3 text-base">
        {pending ? "Saving…" : "Save & generate invoice"}
      </button>
    </form>
  );
}

function Line({ label, value, strong, className = "" }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold" : ""} ${className}`}>
      <dt>{label}</dt>
      <dd>Rs. {value}</dd>
    </div>
  );
}
