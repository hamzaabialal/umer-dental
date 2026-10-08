"use client";

import { submitWith } from "@/components/submit";
import { useActionState } from "react";
import { createUser, resetUserPassword, toggleUser } from "@/lib/actions/settings";

type U = { id: number; username: string; full_name: string; role: string; branch: string | null; active: boolean };

function PasswordNotice({ msg }: { msg: string | null }) {
  if (!msg) return null;
  if (!msg.startsWith("PASSWORD:")) return <p className="text-sm text-red-700">{msg}</p>;
  const [, user, pw] = msg.split(":");
  return (
    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      Password for <b>{user}</b>: <code className="rounded bg-white px-1.5 py-0.5 font-bold">{pw}</code> — share it privately; it
      won&apos;t be shown again. They can change it under My Account.
    </p>
  );
}

function ResetButton({ id }: { id: number }) {
  const [msg, action, pending] = useActionState(resetUserPassword, null);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="btn-ghost px-2.5 py-1 text-xs">Reset password</button>
      {msg && <div className="mt-1"><PasswordNotice msg={msg} /></div>}
    </form>
  );
}

export function Users({ users, meId }: { users: U[]; meId: number }) {
  const [msg, action, pending] = useActionState(createUser, null);
  return (
    <div className="card">
      <h2 className="mb-4 font-semibold text-navy">Users & logins</h2>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Username</th><th>Name</th><th>Role</th><th>Branch</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-semibold">{u.username}</td>
                <td>{u.full_name}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.branch ?? "All"}</td>
                <td>{u.active ? <span className="text-emerald-700">Active</span> : <span className="text-red-700">Disabled</span>}</td>
                <td className="space-x-1 whitespace-nowrap">
                  <ResetButton id={u.id} />
                  {u.id !== meId && (
                    <form action={toggleUser} className="inline">
                      <input type="hidden" name="id" value={u.id} />
                      <button className={`${u.active ? "btn-danger" : "btn-ghost"} px-2.5 py-1 text-xs`}>{u.active ? "Disable" : "Enable"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={submitWith(action)} className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-5 sm:items-end">
        <label className="label">Username<input name="username" required className="input mt-1" /></label>
        <label className="label">Full name<input name="full_name" className="input mt-1" /></label>
        <label className="label">
          Role
          <select name="role" className="input mt-1" defaultValue="receptionist">
            <option value="receptionist">Receptionist (one branch)</option>
            <option value="doctor">Doctor (all branches)</option>
            <option value="admin">Admin (full access)</option>
          </select>
        </label>
        <label className="label">
          Branch
          <select name="branch" className="input mt-1">
            <option value="Bahria">Bahria</option>
            <option value="PWD">PWD</option>
          </select>
        </label>
        <button disabled={pending} className="btn-gold">{pending ? "Creating…" : "Create user"}</button>
        <div className="sm:col-span-5"><PasswordNotice msg={msg} /></div>
      </form>
    </div>
  );
}
