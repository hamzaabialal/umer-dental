"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { markAllBookingsSeen } from "@/lib/actions/appointments";
import { prettyDate, prettyTime } from "@/lib/format";

type NewBooking = { id: number; patient_name: string; branch: string; date: string; time: string; procedure: string };

const POLL_MS = 30_000;

function describe(b: NewBooking) {
  return `${b.branch} • ${prettyDate(b.date)}, ${prettyTime(b.time)}${b.procedure ? ` • ${b.procedure}` : ""}`;
}

/** Short two-note chime; browsers may block it until the user has clicked somewhere on the page. */
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.18;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {}
}

/**
 * Header bell for website bookings nobody has opened yet. Polls every 30s (and when the tab regains focus),
 * shows the count in the tab title, and raises a desktop notification + chime for bookings that arrive while open.
 */
export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<NewBooking[]>([]);
  const [open, setOpen] = useState(false);
  // Read on render: the permission UI only shows inside the dropdown, which is closed during hydration.
  const [, setPermissionAsked] = useState(0);
  const permission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
  const known = useRef<Set<number> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data: { items: NewBooking[] } = await res.json();
      // The first load just records what's already there; only later arrivals raise an alert.
      if (known.current) {
        const fresh = data.items.filter((b) => !known.current!.has(b.id));
        if (fresh.length) {
          chime();
          if ("Notification" in window && Notification.permission === "granted") {
            for (const b of fresh.slice(0, 3)) {
              const n = new Notification(`New website booking: ${b.patient_name}`, {
                body: describe(b),
                tag: `booking-${b.id}`,
              });
              n.onclick = () => {
                window.focus();
                router.push(`/appointments/${b.id}`);
                n.close();
              };
            }
          }
          router.refresh();
        }
      }
      known.current = new Set([...(known.current ?? []), ...data.items.map((b) => b.id)]);
      setItems(data.items);
    } catch {}
  }, [router]);

  // Re-runs on navigation too: opening an appointment marks it seen on the server.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, POLL_MS);
    const onFocus = () => document.visibilityState === "visible" && load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load, pathname]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = items.length ? `(${items.length}) ${base}` : base;
  }, [items.length, pathname]);

  async function enableAlerts() {
    await Notification.requestPermission();
    setPermissionAsked((n) => n + 1);
  }

  async function markAll() {
    setItems([]);
    setOpen(false);
    await markAllBookingsSeen();
    load();
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative cursor-pointer rounded-lg p-2 text-navy hover:bg-slate-100"
        aria-label={`Notifications: ${items.length} new website booking${items.length === 1 ? "" : "s"}`}
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-semibold text-navy">New website bookings</div>
              {items.length > 0 && (
                <button onClick={markAll} className="cursor-pointer text-xs font-medium text-slate-500 hover:text-navy">
                  Mark all as seen
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No new bookings. You&apos;re all caught up.</p>
            ) : (
              <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                {items.map((b) => (
                  <li key={b.id}>
                    <Link href={`/appointments/${b.id}`} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-slate-50">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-600" />
                        {b.patient_name}
                      </div>
                      <div className="mt-0.5 pl-4 text-xs text-slate-500">{describe(b)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {permission === "default" && (
              <button onClick={enableAlerts} className="w-full cursor-pointer border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-slate-100">
                🔔 Turn on desktop alerts
              </button>
            )}
            {permission === "denied" && (
              <p className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                Desktop alerts are blocked. Allow notifications for this site in your browser settings.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
