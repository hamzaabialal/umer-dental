"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout, switchBranch } from "@/lib/actions/auth";
import { LogoMark } from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/opd", label: "OPD Visits" },
  { href: "/appointments", label: "Appointments" },
  { href: "/invoices", label: "Invoices" },
  { href: "/prescriptions", label: "Prescriptions" },
  { href: "/expenses", label: "Expenses" },
  { href: "/recalls", label: "Recalls" },
];

export function Shell({
  user,
  branch,
  children,
}: {
  user: { full_name: string; role: string; branch: string | null };
  branch: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = [
    ...NAV,
    ...(user.role === "admin" ? [{ href: "/settings", label: "Settings" }] : []),
    { href: "/account", label: "My Account" },
  ];

  return (
    <div className="min-h-screen lg:pl-60 print:pl-0">
      <aside
        className={`no-print fixed inset-y-0 left-0 z-30 w-60 transform bg-navy-dark text-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="rounded-lg bg-white p-1">
            <LogoMark size={34} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-wide">UMAR DENTAL</div>
            <div className="text-[10px] tracking-[0.2em] text-gold">& IMPLANT CENTER</div>
          </div>
        </div>
        <nav className="space-y-0.5 px-3">
          {nav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4 text-xs">
          <div className="font-semibold">{user.full_name}</div>
          <div className="text-slate-400 capitalize">
            {user.role}
            {user.branch ? ` • ${user.branch}` : ""}
          </div>
          <form action={logout} className="mt-3">
            <button className="w-full cursor-pointer rounded-lg bg-white/10 py-2 hover:bg-white/15">Sign out</button>
          </form>
        </div>
      </aside>
      {open && <div className="no-print fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <header className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
        <button className="btn-ghost lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          ☰
        </button>
        <div className="text-sm text-slate-500">
          Viewing: <b className="text-navy">{branch ? `${branch} branch` : "All branches"}</b>
        </div>
        {!user.branch && (
          <form action={switchBranch} className="flex items-center gap-2">
            <input type="hidden" name="back" value={pathname} />
            <select
              name="branch"
              defaultValue={branch ?? "all"}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="input w-auto py-1.5"
            >
              <option value="all">All branches</option>
              <option value="Bahria">Bahria</option>
              <option value="PWD">PWD</option>
            </select>
          </form>
        )}
      </header>
      <main className="p-4 lg:p-8 print:p-0">{children}</main>
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
