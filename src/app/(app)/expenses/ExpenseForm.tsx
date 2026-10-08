"use client";

import { useActionState, useEffect, useRef } from "react";
import { addExpense } from "@/lib/actions/records";
import { BranchField } from "@/components/BranchField";

export function ExpenseForm({ branches, defaultBranch, today }: { branches: string[]; defaultBranch: string; today: string }) {
  const [msg, action, pending] = useActionState(addExpense, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (msg === "ok") ref.current?.reset();
  }, [msg]);
  return (
    <form ref={ref} action={action} className="card mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
      <label className="label">
        Date
        <input name="date" type="date" defaultValue={today} className="input mt-1" />
      </label>
      <BranchField branches={branches} defaultValue={defaultBranch} />
      <label className="label">
        Category
        <input name="category" list="exp-cats" className="input mt-1" placeholder="Lab Payment" />
        <datalist id="exp-cats">
          {["Lab Payment", "Materials", "Rent", "Salaries", "Utilities", "Other Expense"].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className="label lg:col-span-2">
        Description
        <input name="description" className="input mt-1" />
      </label>
      <label className="label">
        Amount (Rs.)
        <input name="amount" type="number" min={1} required className="input mt-1" />
      </label>
      <div className="flex items-center gap-3 lg:col-span-6">
        <button disabled={pending} className="btn-gold">
          {pending ? "Saving…" : "Add expense"}
        </button>
        {msg && msg !== "ok" && <span className="text-sm text-red-700">{msg}</span>}
        {msg === "ok" && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </form>
  );
}
