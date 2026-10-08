"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/auth";

export function PasswordForm() {
  const [msg, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-3">
      <label className="label">Current password<input name="current" type="password" required autoComplete="current-password" className="input mt-1" /></label>
      <label className="label">New password (8+ characters)<input name="next" type="password" required minLength={8} autoComplete="new-password" className="input mt-1" /></label>
      <label className="label">Confirm new password<input name="confirm" type="password" required autoComplete="new-password" className="input mt-1" /></label>
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg === "ok" ? "Password changed." : msg}
        </p>
      )}
      <button disabled={pending} className="btn-primary">{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
